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
  // Acepta fechaCompra o fecha desde el body de la petición
  const { proveedor, costo, categoria, producto, urlSaaS, fechaCompra, fecha } = req.body
  const valorFechaFinal = fechaCompra || fecha

  console.log('--- NUEVO REGISTRO (POST) ---')
  console.log('Datos recibidos:', { proveedor, costo, categoria, producto, urlSaaS, fechaCompra: valorFechaFinal })

  try {
    let pool = await sql.connect(config)
    let request = pool.request()
      .input('Proveedor', sql.NVarChar, proveedor)
      .input('Costo', sql.Decimal(10, 2), costo)
      .input('Categoria', sql.NVarChar, categoria)
      .input('Producto', sql.NVarChar, producto)
      .input('URL_SaaS', sql.NVarChar, urlSaaS)

    // Validamos si llegó un valor de fecha manual
    const fechaValida = (valorFechaFinal && String(valorFechaFinal).trim() !== '') ? valorFechaFinal : null
    request.input('FechaCompra', sql.Date, fechaValida)

    await request.query(`
      INSERT INTO Compras (Proveedor, Costo, Categoria, Producto, URL_SaaS, FechaCompra, FechaCreacion) 
      VALUES (@Proveedor, @Costo, @Categoria, @Producto, @URL_SaaS, @FechaCompra, CAST(GETDATE() AS DATE))
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
  const { proveedor, costo, categoria, producto, urlSaaS, fechaCompra, fecha } = req.body
  const valorFechaFinal = fechaCompra || fecha

  console.log('--- ACTUALIZACIÓN DE REGISTRO (PUT) ---')
  console.log('ID a modificar:', id)
  console.log('Body recibido:', { proveedor, costo, categoria, producto, urlSaaS, fechaCompra: valorFechaFinal })

  const idNumero = parseInt(id, 10)

  if (isNaN(idNumero)) {
    return res.status(400).send('El ID proporcionado no es un número entero válido.')
  }

  try {
    let pool = await sql.connect(config)
    let request = pool.request()
      .input('ID', sql.Int, idNumero)
      .input('Proveedor', sql.NVarChar, proveedor)
      .input('Costo', sql.Decimal(10, 2), costo)
      .input('Categoria', sql.NVarChar, categoria)
      .input('Producto', sql.NVarChar, producto)
      .input('URL_SaaS', sql.NVarChar, urlSaaS)

    const fechaValida = (valorFechaFinal && String(valorFechaFinal).trim() !== '') ? valorFechaFinal : null
    request.input('FechaCompra', sql.Date, fechaValida)

    const queryFinal = `
      UPDATE Compras 
      SET Proveedor = @Proveedor, 
          Costo = @Costo, 
          Categoria = @Categoria, 
          Producto = @Producto, 
          URL_SaaS = @URL_SaaS,
          FechaCompra = @FechaCompra
      WHERE Numero = @ID
    `

    const resultado = await request.query(queryFinal)
    console.log('Filas afectadas:', resultado.rowsAffected[0])

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