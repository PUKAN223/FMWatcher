use std::fs::OpenOptions;
use std::io::Write;
use std::path::PathBuf;
use std::time::Duration;
use tauri::Manager;

fn log_debug(msg: &str) {
    if let Ok(mut file) = OpenOptions::new()
        .create(true)
        .append(true)
        .open(std::env::temp_dir().join("fmwatcher_debug.log"))
    {
        let _ = writeln!(file, "[{}] {}", chrono::Local::now().format("%H:%M:%S"), msg);
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    log_debug("=== App starting ===");

    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            let handle = app.handle().clone();

            // In production/packaged mode, launch Next.js server & LINE listener
            #[cfg(not(debug_assertions))]
            {
                let resource_dir = handle.path().resource_dir().unwrap_or_default();
                log_debug(&format!("Resource Dir: {:?}", resource_dir));

                // Check possible paths for standalone directory
                let possible_paths = vec![
                    resource_dir.join("standalone"),
                    resource_dir.join("_up_").join(".next").join("standalone"),
                    resource_dir.join(".next").join("standalone"),
                    resource_dir.join("..").join("..").join("..").join(".next").join("standalone"),
                ];

                let mut standalone_dir = possible_paths[0].clone();
                for path in possible_paths {
                    if path.join("server.js").exists() {
                        standalone_dir = path;
                        break;
                    }
                }

                // Fallback 2: using current_exe
                if !standalone_dir.join("server.js").exists() {
                    if let Ok(exe_path) = std::env::current_exe() {
                        if let Some(project_root) = exe_path.parent().and_then(|p| p.parent()).and_then(|p| p.parent()).and_then(|p| p.parent()) {
                            let root_standalone = project_root.join(".next").join("standalone");
                            if root_standalone.join("server.js").exists() {
                                standalone_dir = root_standalone;
                            }
                        }
                    }
                }

                // Fallback 3: using current_dir
                if !standalone_dir.join("server.js").exists() {
                    if let Ok(cwd) = std::env::current_dir() {
                        let root_standalone = cwd.join(".next").join("standalone");
                        if root_standalone.join("server.js").exists() {
                            standalone_dir = root_standalone;
                        }
                    }
                }

                log_debug(&format!("Selected Standalone Dir: {:?}", standalone_dir));
                let server_js = standalone_dir.join("server.js");
                log_debug(&format!("server.js exists: {}", server_js.exists()));

                // Find bun.exe: bundled in standalone, or bundled in resource_dir, or system bun
                let mut bun_exe = standalone_dir.join("bun.exe");
                if !bun_exe.exists() {
                    bun_exe = resource_dir.join("bun.exe");
                }
                if !bun_exe.exists() {
                    bun_exe = PathBuf::from("bun");
                }

                log_debug(&format!("Using bun path: {:?}", bun_exe));

                if server_js.exists() {
                    // 1. Launch Next.js standalone server with Bun
                    let mut next_cmd = std::process::Command::new(&bun_exe);
                    next_cmd
                        .arg("server.js")
                        .current_dir(&standalone_dir)
                        .env("PORT", "3030")
                        .env("NODE_ENV", "production");

                    #[cfg(target_os = "windows")]
                    {
                        use std::os::windows::process::CommandExt;
                        next_cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
                    }

                    match next_cmd.spawn() {
                        Ok(_) => log_debug("Successfully spawned Next.js server with Bun"),
                        Err(e) => log_debug(&format!("Failed to spawn Next.js server: {:?}", e)),
                    }

                    // 2. Launch LINE listener daemon with Bun
                    let mut listener_script = standalone_dir.join("scripts").join("server.js");
                    if !listener_script.exists() {
                        listener_script = standalone_dir.join("scripts").join("server.ts");
                    }
                    if listener_script.exists() {
                        let mut listener_cmd = std::process::Command::new(&bun_exe);
                        listener_cmd
                            .arg("run")
                            .arg(&listener_script)
                            .current_dir(&standalone_dir)
                            .env("NEXT_PUBLIC_APP_URL", "http://localhost:3030");

                        #[cfg(target_os = "windows")]
                        {
                            use std::os::windows::process::CommandExt;
                            listener_cmd.creation_flags(0x08000000);
                        }

                        if let Ok(log_file) = std::fs::OpenOptions::new()
                            .create(true)
                            .append(true)
                            .open(std::env::temp_dir().join("fmwatcher_listener.log"))
                        {
                            listener_cmd.stdout(log_file.try_clone().unwrap());
                            listener_cmd.stderr(log_file);
                        }

                        match listener_cmd.spawn() {
                            Ok(_) => log_debug("Successfully spawned Listener daemon with Bun"),
                            Err(e) => log_debug(&format!("Failed to spawn Listener: {:?}", e)),
                        }
                    } else {
                        log_debug(&format!("Listener script not found at {:?}", listener_script));
                    }
                } else {
                    log_debug("ERROR: server.js not found in any path!");
                }
            }

            // Spawn background supervisor to wait for /api/health before revealing window
            tauri::async_runtime::spawn(async move {
                let client = reqwest::Client::builder()
                    .timeout(Duration::from_secs(3))
                    .build()
                    .unwrap_or_default();

                let health_url = "http://127.0.0.1:3030/api/health";
                log_debug(&format!("Polling health check at {}", health_url));

                let mut retries = 0;
                let mut success = false;

                while retries < 40 {
                    match client.get(health_url).send().await {
                        Ok(res) => {
                            let status = res.status();
                            log_debug(&format!("Health check response: status={}", status));
                            if status.is_success() {
                                log_debug("✅ Health check PASSED!");
                                success = true;
                                break;
                            }
                        }
                        Err(e) => {
                            log_debug(&format!("Health check attempt {} failed: {:?}", retries + 1, e));
                        }
                    }
                    tokio::time::sleep(Duration::from_millis(500)).await;
                    retries += 1;
                }

                if !success {
                    log_debug("WARNING: Health check timed out after 20 seconds. Revealing window anyway.");
                }

                // Reveal main window
                if let Some(window) = handle.get_webview_window("main") {
                    log_debug("Revealing main window and setting location to http://127.0.0.1:3030");
                    let _ = window.eval("window.location.href = 'http://127.0.0.1:3030'");
                    let _ = window.show();
                    let _ = window.set_focus();
                } else {
                    log_debug("ERROR: Could not get main window!");
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
