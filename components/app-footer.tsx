export default function AppFooter() {
  return (
    <div className="md:block hidden mt-8 text-center text-sm text-amber-600">
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl px-6 py-4 inline-block border border-rose-100">
        <div className="flex items-center justify-center gap-2">
          ⌨️ Keyboard shortcuts:{" "}
          <span className="flex items-center gap-2">
            <span>
              <kbd className="px-3 py-1 bg-white rounded-lg shadow-sm border border-amber-200">
                Ctrl+/
              </kbd>{" "}
              New task
            </span>
            <div
              className="h-5 w-px bg-amber-300 mx-2 rounded"
              aria-hidden="true"
            ></div>
            <span>
              <kbd className="px-3 py-1 bg-white rounded-lg shadow-sm border border-amber-200">
                Enter
              </kbd>{" "}
              Create & print ✨
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}