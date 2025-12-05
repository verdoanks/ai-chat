import ChatWidget from "./ChatWidget";

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-800">Website Demo</h1>
        <p className="text-gray-600">Klik tombol di pojok kanan bawah untuk chat.</p>
      </div>

      {/* Panggil Widget */}
      <ChatWidget />
    </div>
  );
}

export default App;
