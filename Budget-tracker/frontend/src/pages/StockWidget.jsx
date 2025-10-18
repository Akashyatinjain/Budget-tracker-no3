import React, { useState } from "react";
import axios from "axios";

const StockWidget = () => {
  const [symbol, setSymbol] = useState("RELIANCE.BSE");
  const [stock, setStock] = useState(null);

  const fetchStock = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/stocks/${symbol}`);
      setStock(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-[#1b0128]/70 p-4 rounded-xl text-gray-100">
      <h2 className="text-purple-300 font-bold mb-2">Live Stock Price</h2>
      <input
        value={symbol}
        onChange={(e) => setSymbol(e.target.value)}
        className="p-2 rounded-md mb-2 text-black w-full"
      />
      <button
        onClick={fetchStock}
        className="bg-purple-500 px-4 py-2 rounded-md hover:bg-purple-600"
      >
        Get Price
      </button>

      {stock && (
        <div className="mt-4">
          <p>Symbol: {stock["01. symbol"]}</p>
          <p>Price: ₹{parseFloat(stock["05. price"]).toFixed(2)}</p>
          <p>Change: {parseFloat(stock["09. change"]).toFixed(2)} ({stock["10. change percent"]})</p>
        </div>
      )}
    </div>
  );
};

export default StockWidget;
