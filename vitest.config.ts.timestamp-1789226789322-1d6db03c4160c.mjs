// vitest.config.ts
import { defineConfig } from "file:///E:/codex_project/%E6%B0%B8%E5%98%89%E5%86%9C%E5%95%86%E6%9D%AF/node_modules/vitest/dist/config.js";
import react from "file:///E:/codex_project/%E6%B0%B8%E5%98%89%E5%86%9C%E5%95%86%E6%9D%AF/node_modules/@vitejs/plugin-react/dist/index.js";
var vitest_config_default = defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    exclude: ["tests/e2e/**", "**/node_modules/**", "**/dist/**"]
  }
});
export {
  vitest_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZXN0LmNvbmZpZy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkU6XFxcXGNvZGV4X3Byb2plY3RcXFxcXHU2QzM4XHU1NjA5XHU1MTlDXHU1NTQ2XHU2NzZGXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJFOlxcXFxjb2RleF9wcm9qZWN0XFxcXFx1NkMzOFx1NTYwOVx1NTE5Q1x1NTU0Nlx1Njc2RlxcXFx2aXRlc3QuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9FOi9jb2RleF9wcm9qZWN0LyVFNiVCMCVCOCVFNSU5OCU4OSVFNSU4NiU5QyVFNSU5NSU4NiVFNiU5RCVBRi92aXRlc3QuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZXN0L2NvbmZpZydcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCdcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW3JlYWN0KCldLFxuICB0ZXN0OiB7XG4gICAgZW52aXJvbm1lbnQ6ICdqc2RvbScsXG4gICAgc2V0dXBGaWxlczogWycuL3Rlc3RzL3NldHVwLnRzJ10sXG4gICAgZXhjbHVkZTogWyd0ZXN0cy9lMmUvKionLCAnKiovbm9kZV9tb2R1bGVzLyoqJywgJyoqL2Rpc3QvKionXSxcbiAgfSxcbn0pXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXNTLFNBQVMsb0JBQW9CO0FBQ25VLE9BQU8sV0FBVztBQUVsQixJQUFPLHdCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDakIsTUFBTTtBQUFBLElBQ0osYUFBYTtBQUFBLElBQ2IsWUFBWSxDQUFDLGtCQUFrQjtBQUFBLElBQy9CLFNBQVMsQ0FBQyxnQkFBZ0Isc0JBQXNCLFlBQVk7QUFBQSxFQUM5RDtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
