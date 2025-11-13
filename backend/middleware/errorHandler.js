// backend/middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error:', err);
  }

  // Error de PostgreSQL - Violación de constraint
  if (err.code === '23505') {
    error.message = 'Valor duplicado - Este registro ya existe';
    error.statusCode = 400;
  }

  // Error de PostgreSQL - Violación de foreign key
  if (err.code === '23503') {
    error.message = 'Referencia inválida - El registro relacionado no existe';
    error.statusCode = 400;
  }

  // Error de PostgreSQL - Violación de check constraint
  if (err.code === '23514') {
    error.message = 'Valor inválido - No cumple con las restricciones';
    error.statusCode = 400;
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Error del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;