import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ButterflyIcon } from "../utils/icons";
import { isSessionValid, markSessionStart } from "../utils/auth";

const PIN_LENGTH = 6;
const VALID_PIN = "482931";

export default function Login() {
  const [digits, setDigits] = useState(Array(PIN_LENGTH).fill(""));
  const [touched, setTouched] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const refs = useRef([...Array(PIN_LENGTH)].map(() => null));
  const navigate = useNavigate();
  useEffect(() => {
    if (isSessionValid()) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate, isSessionValid]);

  const pin = digits.join("");
  const isValid = pin.length === PIN_LENGTH;

  const setDigit = (i, v) => {
    const next = [...digits];
    next[i] = v;
    setDigits(next);
  };

  const handleChange = (i) => (e) => {
    const val = e.target.value.replace(/\D/g, "");
    const char = val.slice(-1);
    setDigit(i, char);
    if (errorMsg) setErrorMsg(""); // limpia el error al escribir
    if (char && i < PIN_LENGTH - 1) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i) => (e) => {
    if (e.key === "Backspace") {
      if (digits[i]) {
        setDigit(i, "");
        if (errorMsg) setErrorMsg("");
        return;
      }
      if (i > 0) {
        refs.current[i - 1]?.focus();
        setDigit(i - 1, "");
        if (errorMsg) setErrorMsg("");
      }
    }
    if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < PIN_LENGTH - 1) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData("text") || "";
    const digitsOnly = text.replace(/\D/g, "").slice(0, PIN_LENGTH).split("");
    if (!digitsOnly.length) return;
    const next = Array(PIN_LENGTH).fill("");
    for (let i = 0; i < digitsOnly.length; i++) next[i] = digitsOnly[i];
    setDigits(next);
    const last = Math.min(digitsOnly.length, PIN_LENGTH) - 1;
    refs.current[last]?.focus();
    if (errorMsg) setErrorMsg("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (!isValid) return;

    if (pin === VALID_PIN) {
      markSessionStart();
      navigate("/dashboard");
    } else {
      setErrorMsg("PIN incorrecto. Inténtalo de nuevo.");
      setDigits(Array(PIN_LENGTH).fill(""));
      refs.current[0]?.focus();
    }
  };

  return (
    <div className="full-screen-login">
      <form
        onSubmit={handleSubmit}
        style={{
          width: 520,
          maxWidth: "92vw",
          background: "rgba(3, 23, 24, 0.85)",
          border: "1px solid rgba(210, 242, 82, 0.15)",
          borderRadius: 12,
          boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
          padding: "28px 32px 24px",
          position: "relative",
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
          <ButterflyIcon width="10%" />
        </div>

        <h1
          style={{
            textAlign: "center",
            fontSize: 28,
            fontWeight: 800,
            color: "#f4fccb",
            margin: "0 0 6px",
          }}
        >
          Bienvenido a ima
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#fbfee7",
            margin: "0 0 22px",
            lineHeight: 1.0,
            fontSize: 14,
          }}
        >
          Ingrese su PIN de 6 dígitos para continuar.
        </p>

        <div
          onPaste={handlePaste}
          onBlur={() => setTouched(true)}
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 14,
            margin: "0 auto 18px",
            padding: "0 4px",
            width: "100%",
            maxWidth: 420,
            boxSizing: "border-box",
          }}
        >
          {digits.map((d, i) => {
            const error = touched && !isValid;
            return (
              <input
                key={i}
                ref={(el) => (refs.current[i] = el)}
                value={d}
                onChange={handleChange(i)}
                onKeyDown={handleKeyDown(i)}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                type="password"
                autoComplete="one-time-code"
                aria-label={`Dígito ${i + 1} del PIN`}
                style={{
                  width: "clamp(40px, 8.5vw, 56px)",
                  background: "transparent",
                  border: "none",
                  borderBottom: `3px solid ${error ? "#ff6b6b" : "rgba(210, 242, 82, 0.6)"
                    }`,
                  outline: "none",
                  height: 48,
                  fontSize: 28,
                  textAlign: "center",
                  color: "#E9FFD0",
                  padding: 0,
                  transition: "border-color .15s, transform .05s",
                  WebkitTextSecurity: "disc",
                }}
              />
            );
          })}
        </div>

        {/* Alert inline debajo de los pines */}
        {errorMsg && (
          <div
            role="alert"
            aria-live="assertive"
            style={{
              margin: "0 auto 28px",
              width: "100%",
              maxWidth: 420,
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255, 107, 107, 0.7)",
              background: "rgba(255, 107, 107, 0.10)",
              color: "#ff6b6b",
              fontSize: 14,
              textAlign: "center",
              boxSizing: "border-box",
            }}
          >
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={!isValid}
          style={{
            width: "100%",
            height: 44,
            border: "none",
            borderRadius: 8,
            fontWeight: 700,
            background: "#D2F252",
            color: "#082323",
            boxShadow: "0 0 30px 6px rgba(210, 242, 82, 0.35)",
            ...(isValid ? {} : { opacity: 0.6, cursor: "not-allowed" }),
          }}
        >
          Ingresar
        </button>
      </form>
    </div>
  );
}
