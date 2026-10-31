use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Manager};
use std::sync::atomic::{AtomicBool, Ordering};
#[derive(Default)]
struct DownloadControl { cancelled: AtomicBool }
#[derive(Default)]
struct ChatControl { cancel: tokio::sync::Notify }


const BASE: &str = "http://127.0.0.1:11434";
fn client() -> Result<reqwest::Client, String> {
    reqwest::Client::builder().timeout(std::time::Duration::from_secs(300)).build().map_err(|e| e.to_string())
}
#[derive(Serialize)]
struct EngineStatus { connected: bool, version: Option<String>, error: Option<String> }
#[derive(Deserialize)]
struct VersionResponse { version: Option<String> }
#[derive(Serialize, Deserialize)]
struct ModelInfo { name: String, size: u64, modified_at: Option<String> }
#[derive(Deserialize)]
struct ModelsResponse { models: Option<Vec<ModelInfo>> }
#[derive(Serialize, Deserialize)]
struct WireMessage { role: String, content: String }
#[derive(Serialize, Clone)]
struct Progress { model: String, status: String, completed: Option<u64>, total: Option<u64>, percent: Option<u8>, error: Option<String> }
#[derive(Deserialize)]
struct ChatResponse { message: Option<WireMessage> }

#[tauri::command]
async fn check_engine() -> EngineStatus {
    let request = match client() { Ok(v) => v, Err(e) => return EngineStatus { connected: false, version: None, error: Some(e) } };
    match request.get(format!("{BASE}/api/version")).send().await {
        Ok(res) if res.status().is_success() => match res.json::<VersionResponse>().await {
            Ok(v) => EngineStatus { connected: true, version: v.version, error: None },
            Err(e) => EngineStatus { connected: false, version: None, error: Some(e.to_string()) }
        },
        Ok(res) => EngineStatus { connected: false, version: None, error: Some(format!("Ollama HTTP {}", res.status())) },
        Err(e) => EngineStatus { connected: false, version: None, error: Some(e.to_string()) }
    }
}
#[tauri::command]
async fn list_models() -> Result<Vec<ModelInfo>, String> {
    let res = client()?.get(format!("{BASE}/api/tags")).send().await.map_err(|e| e.to_string())?;
    let res = res.error_for_status().map_err(|e| e.to_string())?;
    Ok(res.json::<ModelsResponse>().await.map_err(|e| e.to_string())?.models.unwrap_or_default())
}
#[tauri::command]
fn cancel_chat(app: AppHandle) { app.state::<ChatControl>().cancel.notify_waiters(); }
#[tauri::command]
async fn chat_with_model(app: AppHandle, model: String, messages: Vec<WireMessage>, temperature: Option<f32>) -> Result<String, String> {
    if model.trim().is_empty() { return Err("Select a model".into()); }
    let request = client()?.post(format!("{BASE}/api/chat"))
      .json(&serde_json::json!({"model":model,"messages":messages,"stream":false,"options":{"temperature":temperature.unwrap_or(0.7).clamp(0.0,2.0)}}));
    let chat_control = app.state::<ChatControl>();
    let response = tokio::select! {
        result = request.send() => result.map_err(|e| e.to_string())?.error_for_status().map_err(|e| e.to_string())?,
        _ = chat_control.cancel.notified() => return Err("Request cancelled".into())
    };
    let data: ChatResponse = response.json().await.map_err(|e| e.to_string())?;
    data.message.map(|m| m.content).ok_or_else(|| "No assistant reply".into())
}
#[tauri::command]
async fn delete_model(name: String) -> Result<(), String> {
    if name.trim().is_empty() { return Err("Missing model name".into()); }
    client()?.delete(format!("{BASE}/api/delete"))
      .json(&serde_json::json!({"model":name}))
      .send().await.map_err(|e| e.to_string())?.error_for_status().map_err(|e| e.to_string())?;
    Ok(())
}
#[tauri::command]
fn cancel_pull(app: AppHandle) { app.state::<DownloadControl>().cancelled.store(true, Ordering::SeqCst); }
#[tauri::command]
async fn pull_model(app: AppHandle, name: String) -> Result<(), String> {
    app.state::<DownloadControl>().cancelled.store(false, Ordering::SeqCst);
    if name.trim().is_empty() { return Err("Missing model name".into()); }
    let mut res = client()?.post(format!("{BASE}/api/pull"))
      .json(&serde_json::json!({"model":name,"stream":true}))
      .send().await.map_err(|e| e.to_string())?.error_for_status().map_err(|e| e.to_string())?;
    let mut buffer: Vec<u8> = Vec::new();
    while let Some(chunk) = res.chunk().await.map_err(|e| e.to_string())? {
        if app.state::<DownloadControl>().cancelled.load(Ordering::SeqCst) { return Err("Download cancelled".into()); }
        buffer.extend_from_slice(&chunk);
        while let Some(index) = buffer.iter().position(|b| *b == b'\n') {
            let line = buffer.drain(..=index).collect::<Vec<u8>>();
            emit_progress_line(&app, &name, &line)?;
        }
    }
    if !buffer.is_empty() { emit_progress_line(&app, &name, &buffer)?; }
    Ok(())
}
fn emit_progress_line(app: &AppHandle, model: &str, line: &[u8]) -> Result<(), String> {
    if line.iter().all(u8::is_ascii_whitespace) { return Ok(()); }
    let value: serde_json::Value = serde_json::from_slice(line).map_err(|e| e.to_string())?;
    if let Some(err) = value.get("error").and_then(|v| v.as_str()) { return Err(err.into()); }
    let completed = value.get("completed").and_then(|v| v.as_u64());
    let total = value.get("total").and_then(|v| v.as_u64());
    let percent = match (completed, total) {
        (Some(done), Some(size)) if size > 0 => Some(((done as f64 / size as f64) * 100.0).round().clamp(0.0, 100.0) as u8),
        _ => None,
    };
    app.emit("model-pull-progress", Progress {
        model: model.to_owned(),
        status: value.get("status").and_then(|v| v.as_str()).unwrap_or("").to_owned(),
        completed, total, percent, error: None,
    }).map_err(|e| e.to_string())
}

pub fn run() {
    tauri::Builder::default()
        .manage(DownloadControl::default())
        .manage(ChatControl::default())
        .invoke_handler(tauri::generate_handler![check_engine, list_models, chat_with_model, delete_model, pull_model, cancel_pull, cancel_chat])
        .run(tauri::generate_context!())
        .expect("error running HASSA desktop application");
}
