// Prevents an additional console window on Windows in release. Harmless on Linux.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod backend;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            backend::get_capabilities,
            backend::apply_effect,
            backend::apply_static_zones,
            backend::list_profiles,
            backend::save_profile,
            backend::load_profile,
            backend::read_profile,
            backend::delete_profile,
            backend::import_profile,
            backend::export_profile,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Predator NoSense");
}
