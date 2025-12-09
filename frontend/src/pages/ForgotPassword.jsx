import React, { useState } from 'react';

const ForgotPassword = () => {
  const [correo, setCorreo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    setError('');
    setEnviando(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/usuario/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo })
      });
      const data = await res.json();
      if (res.ok) {
        setMensaje('Si el correo existe, se ha enviado un enlace para restablecer la contraseña.');
      } else {
        setError(data.error || 'Error al enviar el correo');
      }
    } catch (err) {
      setError('Error de red');
    }
    setEnviando(false);
  };

  return (
    <div className="login-container">
      <div className="login-form-box">
        <h2>Recuperar contraseña</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Correo electrónico"
            value={correo}
            onChange={e => setCorreo(e.target.value)}
            required
            className="input-field"
          />
          <button type="submit" className="submit-button" disabled={enviando}>
            {enviando ? 'Enviando...' : 'Enviar enlace'}
          </button>
        </form>
        {mensaje && <div style={{ color: 'green', marginTop: 10 }}>{mensaje}</div>}
        {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
      </div>
    </div>
  );
};

export default ForgotPassword;
