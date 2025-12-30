"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PayofflinePage() {
  const [amount, setAmount] = useState("");
  const [sipType, setSipType] = useState("");
  const [sipId, setSipId] = useState(""); // Add sipId state
  const [utrNo, setUtrNo] = useState("");
  const [otp, setOtp] = useState("");
  const [shop, setShop] = useState("Select Shop");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [trId, setTrId] = useState("");
  const [step, setStep] = useState(1);
  const [apiResponse, setApiResponse] = useState("");
  const router = useRouter();

  useEffect(() => {
    const storedTrId = sessionStorage.getItem("offline_tr_id");
    if (storedTrId) {
      setTrId(storedTrId);
      setStep(2);
      setMessage("Found existing transaction. Please verify OTP.");
    }

    try {
      const amountPayingValuesStr = sessionStorage.getItem("amountPayingValues");
      if (amountPayingValuesStr) {
        const amountPayingValues = JSON.parse(amountPayingValuesStr);
        
        // Get both planId and currentSIPId
        const planId = sessionStorage.getItem("planId");
        const currentSIPId = sessionStorage.getItem("currentSIPId");
        
        // Use currentSIPId if available, otherwise use planId
        const sipIdToUse = currentSIPId || planId;
        
        if (sipIdToUse && amountPayingValues[sipIdToUse]) {
          const amountStr = amountPayingValues[sipIdToUse].replace(/[^0-9.]/g, "");
          setAmount(amountStr);
          setSipId(sipIdToUse); // Set sipId state
        }
      }

      const storedSipType = sessionStorage.getItem("sipType");
      if (storedSipType) {
        setSipType(storedSipType.toLowerCase().trim());
      }
    } catch (error) {
      console.error("Session storage error:", error);
    }
  }, []);

  /* ---------------- TRANSACTION SUBMIT ---------------- */
  const handleTransactionSubmit = async () => {
    const numericAmount = parseFloat(amount) || 0;

    if (!numericAmount || !sipType) {
      setMessage("Please check amount and SIP type");
      return;
    }

    setLoading(true);
    setMessage("");
    setApiResponse("");

    try {
      const transactionData = {
        amount: numericAmount,
        sip_type: sipType,
        sip_id: sipId, // Use the sipId state
        utr_no: utrNo.trim() || null,
        transaction_type: "OFFLINE",
        category: "CREDIT",
        shop: shop !== "Select Shop" ? shop : null,
      };

      console.log("Sending transaction data:", transactionData); // Debug log

      const response = await fetch(
        "http://localhost:5000/api/transactions/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${
              sessionStorage.getItem("authToken") || ""
            }`,
          },
          body: JSON.stringify(transactionData),
        }
      );

      const result = await response.json();
      console.log("Transaction Response:", result);
      setApiResponse(JSON.stringify(result, null, 2));

      if (!response.ok) {
        throw new Error(result.message || "Transaction failed");
      }

      let receivedTrId = "";
      if (result.tr_id) receivedTrId = result.tr_id;
      else if (result.NewTransaction?.tr_id)
        receivedTrId = result.NewTransaction.tr_id;
      else if (result.transaction?.tr_id)
        receivedTrId = result.transaction.tr_id;
      else if (result.data?.tr_id) receivedTrId = result.data.tr_id;

      if (receivedTrId) {
        sessionStorage.setItem("offline_tr_id", receivedTrId);
        setTrId(receivedTrId);
        setStep(2);
        setMessage(
          `✅ Transaction created successfully! Transaction ID: ${receivedTrId}. Please ask admin for OTP.`
        );
      } else {
        setMessage("Transaction created but transaction ID not found.");
      }
    } catch (error) {
      setMessage("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- OTP VERIFICATION ---------------- */
  const handleVerifyOTP = async () => {
    if (!trId || !otp.trim()) {
      setMessage("Please enter OTP");
      return;
    }

    setLoading(true);
    setMessage("");
    setApiResponse("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/transactions/verify-offline",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${
              sessionStorage.getItem("authToken") || ""
            }`,
          },
          body: JSON.stringify({ tr_id: trId, otp: otp.trim() }),
        }
      );

      const result = await response.json();
      setApiResponse(JSON.stringify(result, null, 2));

      if (!response.ok) {
        throw new Error(result.message || "OTP verification failed");
      }

      const successCheck =
        result.success ||
        result.status === "success" ||
        (result.message || "").toLowerCase().includes("verified");

      if (successCheck) {
        setSuccess(true);
        setMessage("✅ OTP verified successfully!");
        sessionStorage.removeItem("offline_tr_id");

        setTimeout(() => router.push("/savings_plan"), 2000);
      } else {
        setMessage(result.message || "OTP verification failed");
      }
    } catch (error) {
      setMessage("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setOtp("");
    setMessage("");
    setApiResponse("");
  };

  const handleNewTransaction = () => {
    sessionStorage.removeItem("offline_tr_id");
    handleReset();
  };

  const debugSessionStorage = () => {
    console.log("=== SESSION STORAGE ===");
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      console.log(key, sessionStorage.getItem(key));
    }
  };

  /* ---------------- UI UPDATES ---------------- */
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 text-center border border-[#50C2C9]">
        <h1 className="text-xl font-bold mb-4 text-[#50C2C9]">Offline Payment</h1>
        
        {/* Debug button */}
        <button 
          onClick={debugSessionStorage}
          className="mb-4 px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Debug Session Storage
        </button>

        {success ? (
          <div className="p-4 bg-green-100 border border-green-400 rounded-lg">
            <h2 className="text-lg font-semibold text-green-700">✅ Payment Successful!</h2>
            <p className="text-green-600 mt-2">OTP verified. Redirecting...</p>
          </div>
        ) : step === 1 ? (
          // Step 1: Transaction Form
          <>
            <div className="space-y-4">
              <div className="text-left">
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="text"
                  value={amount ? `₹${amount}` : ''}
                  readOnly
                  className="w-full border border-gray-300 rounded-lg p-2 bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {amount ? `Amount: ₹${amount}` : 'Amount not found'}
                </p>
              </div>

              <div className="text-left">
                <label className="block text-sm font-medium text-gray-700 mb-1">SIP Type</label>
                <input
                  type="text"
                  value={sipType}
                  readOnly
                  className="w-full border border-gray-300 rounded-lg p-2 bg-gray-50 capitalize"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {sipType ? `SIP Type: ${sipType}` : 'SIP type not found'}
                </p>
              </div>

              <div className="text-left">
                <label className="block text-sm font-medium text-gray-700 mb-1">SIP ID</label>
                <input
                  type="text"
                  value={sipId}
                  readOnly
                  className="w-full border border-gray-300 rounded-lg p-2 bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {sipId ? `SIP ID: ${sipId}` : 'SIP ID not found'}
                </p>
              </div>

              <div className="text-left">
                <label className="block text-sm font-medium text-gray-700 mb-1">UTR Number (Optional)</label>
                <input
                  type="text"
                  value={utrNo}
                  onChange={(e) => setUtrNo(e.target.value)}
                  placeholder="Enter UTR if available"
                  className="w-full border border-gray-300 rounded-lg p-2"
                />
              </div>

              <div className="text-left">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Shop</label>
                <select
                  value={shop}
                  onChange={(e) => setShop(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2"
                >
                  <option>Select Shop</option>
                  <option>abc_jewelers</option>
                  <option>xyz_jewelers</option>
                  <option>premium_jewels</option>
                </select>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700">
                  <span className="font-medium">Transaction Type:</span> OFFLINE
                </p>
                <p className="text-sm text-blue-700">
                  <span className="font-medium">Category:</span> CREDIT
                </p>
                <p className="text-sm text-blue-700">
                  <span className="font-medium">SIP ID:</span> {sipId || "Not found"}
                </p>
                <p className="text-sm text-blue-700">
                  <span className="font-medium">Amount to send:</span> ₹{amount || "0"}
                </p>
              </div>
            </div>

            <button
              onClick={handleTransactionSubmit}
              disabled={loading || !amount || !sipType || !sipId} // Also check sipId
              className="w-full bg-[#50C2C9] text-white py-2 rounded-lg mt-6 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Submitting..." : "Submit Transaction"}
            </button>

            {message && (
              <div className={`mt-4 p-3 rounded-lg ${message.includes("Error") ? "bg-red-50 border border-red-200" : "bg-blue-50 border border-blue-200"}`}>
                <p className={`text-sm ${message.includes("Error") ? "text-red-600" : "text-blue-600"}`}>
                  {message}
                </p>
              </div>
            )}
          </>
        ) : (
          // Step 2: OTP Verification
          <>
            <div className="space-y-4">
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <h3 className="text-sm font-semibold text-yellow-800 mb-2">Transaction Details</h3>
                <p className="text-sm text-yellow-700">
                  <span className="font-medium">Transaction ID:</span> 
                  <span className="font-mono ml-2">{trId}</span>
                </p>
                <p className="text-sm text-yellow-700">
                  <span className="font-medium">SIP ID:</span> {sipId}
                </p>
                <p className="text-sm text-yellow-700">
                  <span className="font-medium">Amount:</span> ₹{amount}
                </p>
                <p className="text-sm text-yellow-700">
                  <span className="font-medium">SIP Type:</span> 
                  <span className="capitalize ml-2">{sipType}</span>
                </p>
                <p className="text-xs text-yellow-600 mt-2">
                  Ask admin for OTP and enter it below
                </p>
              </div>

              <div className="text-left">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enter OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  className="w-full border border-gray-300 rounded-lg p-2 text-center text-lg tracking-widest"
                  maxLength={6}
                  inputMode="numeric"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the OTP provided by admin
                </p>
              </div>
            </div>

            <button
              onClick={handleVerifyOTP}
              disabled={loading || !otp || otp.length < 4}
              className="w-full bg-[#50C2C9] text-white py-2 rounded-lg mt-6 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            <div className="flex gap-2 mt-4">
              <button
                onClick={handleReset}
                className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Back
              </button>
              <button
                onClick={handleNewTransaction}
                className="flex-1 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
              >
                New Transaction
              </button>
            </div>

            {message && (
              <div className={`mt-4 p-3 rounded-lg ${message.includes("Error") ? "bg-red-50 border border-red-200" : "bg-blue-50 border border-blue-200"}`}>
                <p className={`text-sm ${message.includes("Error") ? "text-red-600" : "text-blue-600"}`}>
                  {message}
                </p>
              </div>
            )}
          </>
        )}

        {/* API Response Display */}
        {apiResponse && (
          <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">API Response:</h4>
            <pre className="text-xs text-gray-600 overflow-auto max-h-40">
              {apiResponse}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}