"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OTPPage() {
  const [otp, setOtp] = useState("");
  const [shop, setShop] = useState("Select Shop");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const generateOtp = async () => {
    try {
      const response = await fetch("http://localhost:8089/paymentoffline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shop: shop,
          email: "jeevithcse2022@gmail.com",
        }),
      });

      const result = await response.text();
      if (result.toLowerCase().includes("success")) {
  setSuccess(true);

  // Save offline payment info
  await fetch("http://localhost:8089/payment/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: sessionStorage.getItem("userId"),
      amount: 3000, // or dynamic SIP amount
      dateTime: new Date().toISOString(),
      status: "OFFLINE_VERIFIED",
    }),
  });
}

      alert(result); // show alert after OTP sent
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const handleConfirm = async () => {
    try {
      const response = await fetch("http://localhost:8089/paymentoffline/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "mastershine555@gmail.com",
          otp: otp,
        }),
      });

      const result = await response.text();

      if (result.toLowerCase().includes("success")) {
        setSuccess(true);
      } else {
        setMessage(result);
      }
    } catch (error) {
      setMessage("Error: " + error.message);
    }
  };

  // ✅ Redirect after success
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        router.push("/savings_plan");
        // router.push("/sip");
      }, 2000); // wait 2 sec to show success message

      return () => clearTimeout(timer);
    }
  }, [success, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6 text-center border border-[#50C2C9]">
        <h1 className="text-xl font-bold mb-4 text-[#50C2C9]">Jewellery Shop</h1>

        {!success ? (
          <>
            {/* Dropdown */}
            <select
              value={shop}
              onChange={(e) => setShop(e.target.value)}
              className="w-full border border-[#50C2C9] rounded-lg p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-[#50C2C9]"
            >
              <option>Select Shop</option>
              <option>abc_jewelers</option>
            </select>

            {/* Generate OTP Button */}
            <button
              onClick={generateOtp}
              className="w-full bg-[#50C2C9] text-white font-semibold py-2 rounded-lg mb-4 hover:bg-[#3aa1a8] transition"
            >
              Generate OTP
            </button>

            {/* Enter OTP */}
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              className="w-full border border-[#50C2C9] rounded-lg p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-[#50C2C9]"
            />

            {/* Confirm Button */}
            <button
              onClick={handleConfirm}
              className="w-full bg-[#50C2C9] text-white font-semibold py-2 rounded-lg hover:bg-[#3aa1a8] transition"
            >
              Confirm
            </button>

            {/* Error/Info Message */}
            {message && <p className="mt-4 text-sm text-red-500">{message}</p>}
          </>
        ) : (
          <div className="p-4 bg-green-100 border border-green-400 rounded-xl shadow-md">
            <h2 className="text-lg font-semibold text-green-700">🎉 Congratulations!</h2>
            <p className="text-green-600 mt-2">
              Successfully created your SIP.
            </p>
            <p className="text-xs text-gray-500 mt-2"></p>
          </div>
        )}
      </div>
    </div>
  );
}
