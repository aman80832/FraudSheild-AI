import { useState } from "react";
import axios from "axios";

function UPISimulator({ onAnalysisComplete }) {
  const [amount, setAmount] = useState("");
  const [beneficiaryNew, setBeneficiaryNew] = useState(false);
  const [deviceNew, setDeviceNew] = useState(false);
  const [locationChanged, setLocationChanged] = useState(false);
  const [transactionCount, setTransactionCount] = useState(1);
  const [nightTransaction, setNightTransaction] = useState(false);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function simulatePayment(event) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setResult(null);

    const token = localStorage.getItem("access_token");

    if (!token) {
      setError("Please login again.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:8000/api/fraud/analyze",
        {
          amount: Number(amount),
          beneficiary_new: beneficiaryNew,
          device_new: deviceNew,
          location_changed: locationChanged,
          transaction_count_last_hour:
            Number(transactionCount),
          is_night_transaction: nightTransaction,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setResult(response.data);

      if (onAnalysisComplete) {
        onAnalysisComplete(response.data);
      }

    } catch (error) {
      console.error(
        "UPI simulation error:",
        error
      );

      setError(
        error.response?.data?.detail ||
        "Unable to process simulated payment."
      );

    } finally {
      setLoading(false);
    }
  }

  function resetSimulator() {
    setAmount("");
    setBeneficiaryNew(false);
    setDeviceNew(false);
    setLocationChanged(false);
    setTransactionCount(1);
    setNightTransaction(false);
    setResult(null);
    setError("");
  }

  return (
    <section className="upi-simulator">

      <div className="upi-header">

        <div>
          <span className="ai-label">
            FRAUDSHIELD AI
          </span>

          <h3>
            💳 UPI Transaction Simulator
          </h3>

          <p>
            Simulate a UPI payment and let AI
            evaluate its fraud risk.
          </p>
        </div>

      </div>


      <form onSubmit={simulatePayment}>

        {/* AMOUNT */}

        <div className="field">

          <label>
            UPI Payment Amount
          </label>

          <div className="amount-input">

            <span>₹</span>

            <input
              type="number"
              min="1"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value)
              }
              required
            />

          </div>

        </div>


        {/* BENEFICIARY */}

        <label className="toggle-row">

          <span>
            New beneficiary
          </span>

          <input
            type="checkbox"
            checked={beneficiaryNew}
            onChange={(e) =>
              setBeneficiaryNew(
                e.target.checked
              )
            }
          />

        </label>


        {/* DEVICE */}

        <label className="toggle-row">

          <span>
            New device
          </span>

          <input
            type="checkbox"
            checked={deviceNew}
            onChange={(e) =>
              setDeviceNew(
                e.target.checked
              )
            }
          />

        </label>


        {/* LOCATION */}

        <label className="toggle-row">

          <span>
            Location changed
          </span>

          <input
            type="checkbox"
            checked={locationChanged}
            onChange={(e) =>
              setLocationChanged(
                e.target.checked
              )
            }
          />

        </label>


        {/* FREQUENCY */}

        <div className="field">

          <label>
            Transactions in last hour
          </label>

          <input
            type="number"
            min="0"
            value={transactionCount}
            onChange={(e) =>
              setTransactionCount(
                e.target.value
              )
            }
          />

        </div>


        {/* NIGHT */}

        <label className="toggle-row">

          <span>
            🌙 Unusual/night transaction
          </span>

          <input
            type="checkbox"
            checked={nightTransaction}
            onChange={(e) =>
              setNightTransaction(
                e.target.checked
              )
            }
          />

        </label>


        {error && (
          <div className="dashboard-error">
            {error}
          </div>
        )}


        <div className="upi-buttons">

          <button
            type="submit"
            className="analyze-button"
            disabled={loading}
          >
            {loading
              ? "Processing..."
              : "🔍 Simulate UPI Payment"}
          </button>

          <button
            type="button"
            className="reset-button"
            onClick={resetSimulator}
          >
            Reset
          </button>

        </div>

      </form>


      {/* RESULT */}

      {result && (
        <div className="upi-result">

          <h4>
            🤖 FraudShield Decision
          </h4>

          <div className="upi-result-score">

            <strong>
              {result.analysis?.risk_score ?? 0}
            </strong>

            <span>
              /100
            </span>

          </div>

          <div className="upi-result-level">

            <strong>
              {result.analysis?.risk_level}
            </strong>

            <span>
              {result.analysis?.decision}
            </span>

          </div>

          <p>
            {result.analysis?.message}
          </p>

          {result.analysis?.reasons?.length > 0 && (
            <ul>
              {result.analysis.reasons.map(
                (reason, index) => (
                  <li key={index}>
                    ⚠️ {reason}
                  </li>
                )
              )}
            </ul>
          )}

          {result.alert && (
            <div className="upi-alert">
              🚨 High-risk fraud alert created.
            </div>
          )}

        </div>
      )}

    </section>
  );
}

export default UPISimulator;