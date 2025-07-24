// src/App.jsx
import ChessBoard from './components/ChessBoard';
// import ChessGame from "./components/ChessGame";
import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-black text-white flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-1 mt-4">♟ Chess Game</h1>
      <ChessBoard />
      {/* <ChessGame /> */}
    </div>
  );
}
