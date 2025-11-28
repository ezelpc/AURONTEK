import React, { useState } from 'react';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Obtener token de la URL
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    setError('');
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch('http://localhost:3000/api/usuario/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, nuevaContraseña: password })
      });
      const data = await res.json();
      if (res.ok) {
        setMensaje('Contraseña restablecida correctamente. Ya puedes iniciar sesión.');
      } else {
        setError(data.error || 'Error al restablecer la contraseña');
      }
    } catch (err) {
      setError('Error de red');
    }
    setEnviando(false);
  };

  return (
    <div className="login-container">
      <div className="login-form-box">
        <h2>Restablecer contraseña</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Nueva contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="input-field"
          />
          <input
            type="password"
            placeholder="Confirmar contraseña"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
            className="input-field"
          />
          <button type="submit" className="submit-button" disabled={enviando}>
            {enviando ? 'Enviando...' : 'Restablecer'}
          </button>
        </form>
        {mensaje && <div style={{ color: 'green', marginTop: 10 }}>{mensaje}</div>}
        {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
      </div>
    </div>
  );
};

export default ResetPassword;
