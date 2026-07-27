import express from 'express'
import sql from 'mssql'
import cors from 'cors'
import dotenv from 'dotenv'

// Cargar variables de entorno desde .env (en entorno local)
dotenv.config()

const app = express()

// Middlewares
app.use(express.json())

// Configuración de CORS permitiendo peticiones desde cualquier origen (Static Web App / Local)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Configuración de la conexión a Azure SQL Database
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true, // Obligatorio para Azure SQL
    trustServerCertificate: false
  }
}

// -------------------------------------------------------------
// RUTA 1: Obtener todos los registros de Compras (GET)
// -------------------------------------------------------------
app.get('/api/datos', async (req, res) => {
  try {
    let pool = await sql.connect(config)
    let resultado = await pool.request().query('SELECT * FROM Compras')
    res.json(resultado.recordset)
  } catch (error) {
    console.error('Error al consultar Azure SQL:', error.message)
    res.status(500).send(error.message)
  }
})

// -------------------------------------------------------------
// RUTA 2: Insertar un nuevo registro de Compra (POST)
// -------------------------------------------------------------
app.post('/api/compras', async (req, res) => {
  const { proveedor, costo, categoria, producto, urlSaaS } = req.body

  try {
    let pool = await sql.connect(config)
    await pool.request()
      .input('Proveedor', sql.NVarChar, proveedor)
      .input('Costo', sql.Decimal(10, 2), costo)
      .input('Categoria', sql.NVarChar, categoria)
      .input('Producto', sql.NVarChar, producto)
      .input('URL_SaaS', sql.NVarChar, urlSaaS)
      .query(`
        INSERT INTO Compras (Proveedor, Costo, Categoria, Producto, URL_SaaS, Fecha) 
        VALUES (@Proveedor, @Costo, @Categoria, @Producto, @URL_SaaS, GETDATE())
      `)
    
    res.json({ mensaje: 'Registro guardado exitosamente' })
  } catch (error) {
    console.error('Error al insertar registro:', error.message)
    res.status(500).send(error.message)
  }
})

// -------------------------------------------------------------
// RUTA 3: Actualizar una compra existente (PUT)
// -------------------------------------------------------------
app.put('/api/compras/:id', async (req, res) => {
  const { id } = req.params
  const { proveedor, costo, categoria, producto, urlSaaS } = req.body

  const idNumero = parseInt(id, 10)

  if (isNaN(idNumero)) {
    return res.status(400).send('El ID proporcionado no es un número entero válido.')
  }

  try {
    let pool = await sql.connect(config)
    await pool.request()
      .input('ID', sql.Int, idNumero)
      .input('Proveedor', sql.NVarChar, proveedor)
      .input('Costo', sql.Decimal(10, 2), costo)
      .input('Categoria', sql.NVarChar, categoria)
      .input('Producto', sql.NVarChar, producto)
      .input('URL_SaaS', sql.NVarChar, urlSaaS)
      .query(`
        UPDATE Compras 
        SET Proveedor = @Proveedor, 
            Costo = @Costo, 
            Categoria = @Categoria, 
            Producto = @Producto, 
            URL_SaaS = @URL_SaaS
        WHERE Numero = @ID
      `)
    
    res.json({ mensaje: 'Registro actualizado exitosamente' })
  } catch (error) {
    console.error('Error al actualizar registro:', error.message)
    res.status(500).send(error.message)
  }
})

// Servidor ajustado para Azure App Service o entorno local
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`🚀 Servidor Backend corriendo en puerto ${PORT}`)
})