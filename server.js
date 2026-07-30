import express from 'express'
import sql from 'mssql'
import cors from 'cors'
import dotenv from 'dotenv'
import multer from 'multer'
import { 
  BlobServiceClient, 
  generateBlobSASQueryParameters, 
  BlobSASPermissions, 
  StorageSharedKeyCredential 
} from '@azure/storage-blob'

dotenv.config()

const app = express()

// Middlewares
app.use(express.json())
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Configuración de Multer para recibir archivos en memoria (límite 25MB)
const storage = multer.memoryStorage()
const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } })

// Configuración de conexión a Azure SQL Database
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

/**
 * Subir archivo a Azure Blob Storage y generar enlace SAS público con permiso de lectura
 */
async function subirABlobYObtenerSAS(file) {
  if (!file) return null

  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING
  const containerName = process.env.AZURE_CONTAINER_NAME

  if (!connectionString || !containerName) {
    throw new Error("Faltan las variables AZURE_STORAGE_CONNECTION_STRING o AZURE_CONTAINER_NAME en la configuración del servidor.")
  }

  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
    const containerClient = blobServiceClient.getContainerClient(containerName)

    // Sanitizar nombre de archivo (reemplaza espacios y caracteres raros)
    const nombreLimpio = file.originalname
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9.\-_]/g, '_')

    const blobName = `compra_${Date.now()}_${nombreLimpio}`
    const blockBlobClient = containerClient.getBlockBlobClient(blobName)

    // Subir el buffer recibido
    await blockBlobClient.uploadData(file.buffer, {
      blobHTTPHeaders: { blobContentType: file.mimetype || 'application/octet-stream' }
    })

    // Extraer AccountName y AccountKey de forma segura para firmar la URL SAS
    const accountName = blobServiceClient.accountName
    const matchKey = connectionString.match(/AccountKey=([^;]+)/)
    const accountKey = matchKey ? matchKey[1].replace(/["']/g, '').trim() : ''

    if (!accountKey) {
      throw new Error("No se pudo extraer la AccountKey de la cadena de conexión.")
    }

    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey)

    // Generar Token SAS (Lectura, válido por 100 años)
    const sasToken = generateBlobSASQueryParameters({
      containerName: containerName,
      blobName: blobName,
      permissions: BlobSASPermissions.parse("r"),
      startsOn: new Date(),
      expiresOn: new Date(new Date().valueOf() + 100 * 365 * 24 * 60 * 60 * 1000)
    }, sharedKeyCredential).toString()

    return `${blockBlobClient.url}?${sasToken}`
  } catch (err) {
    console.error("❌ Error en subirABlobYObtenerSAS:", err.message)
    throw new Error(`Error en Blob Storage: ${err.message}`)
  }
}

// -------------------------------------------------------------
// RUTA 1: Obtener todos los registros de Compras (GET)
// -------------------------------------------------------------
app.get('/api/datos', async (req, res) => {
  try {
    let pool = await sql.connect(config)
    let resultado = await pool.request().query('SELECT * FROM Compras ORDER BY FechaCreacion DESC')
    res.json(resultado.recordset)
  } catch (error) {
    console.error('❌ Error al consultar Azure SQL:', error.message)
    res.status(500).send(error.message)
  }
})

// -------------------------------------------------------------
// RUTA 2: Insertar un nuevo registro de Compra (POST)
// -------------------------------------------------------------
app.post('/api/compras', upload.single('archivo'), async (req, res) => {
  const { proveedor, costo, categoria, producto, proyecto, precioUnitario, cantidad, fechaCompra, fecha, urlSaaS } = req.body
  const valorFechaFinal = fechaCompra || fecha
  const file = req.file

  console.log('--- NUEVO REGISTRO (POST) ---')
  console.log('Datos recibidos:', { proveedor, costo, categoria, producto, proyecto, precioUnitario, cantidad, fechaCompra: valorFechaFinal })
  console.log('Archivo adjunto:', file ? file.originalname : 'Sin archivo')

  try {
    let finalUrlSaaS = (urlSaaS && urlSaaS !== 'null' && urlSaaS !== 'undefined') ? urlSaaS : null

    if (file) {
      finalUrlSaaS = await subirABlobYObtenerSAS(file)
    }

    let pool = await sql.connect(config)
    let request = pool.request()
      .input('Proveedor', sql.NVarChar, proveedor || '')
      .input('Costo', sql.Decimal(10, 2), parseFloat(costo) || 0)
      .input('Categoria', sql.NVarChar, categoria || '')
      .input('Producto', sql.NVarChar, producto || '')
      .input('Proyecto', sql.NVarChar, proyecto || null)
      .input('PrecioUnitario', sql.Decimal(10, 2), parseFloat(precioUnitario) || 0)
      .input('Cantidad', sql.Int, parseInt(cantidad, 10) || 0)
      .input('URL_SaaS', sql.NVarChar, finalUrlSaaS)

    const fechaValida = (valorFechaFinal && String(valorFechaFinal).trim() !== '' && String(valorFechaFinal) !== 'null') 
      ? valorFechaFinal 
      : null
    request.input('FechaCompra', sql.Date, fechaValida)

    await request.query(`
      INSERT INTO Compras (Proveedor, Costo, Categoria, Producto, Proyecto, PrecioUnitario, Cantidad, URL_SaaS, FechaCompra, FechaCreacion) 
      VALUES (@Proveedor, @Costo, @Categoria, @Producto, @Proyecto, @PrecioUnitario, @Cantidad, @URL_SaaS, @FechaCompra, CAST(GETDATE() AS DATE))
    `)

    res.json({ mensaje: 'Registro guardado exitosamente', urlSaaS: finalUrlSaaS })
  } catch (error) {
    console.error('❌ Error al insertar registro:', error.message)
    res.status(500).send(error.message)
  }
})

// -------------------------------------------------------------
// RUTA 3: Actualizar una compra existente (PUT)
// -------------------------------------------------------------
app.put('/api/compras/:id', upload.single('archivo'), async (req, res) => {
  const { id } = req.params
  const { proveedor, costo, categoria, producto, proyecto, precioUnitario, cantidad, fechaCompra, fecha, urlSaaS } = req.body
  const valorFechaFinal = fechaCompra || fecha
  const file = req.file

  const idNumero = parseInt(id, 10)
  if (isNaN(idNumero)) {
    return res.status(400).send('El ID proporcionado no es un número entero válido.')
  }

  console.log('--- ACTUALIZACIÓN DE REGISTRO (PUT) ---')
  console.log('ID a modificar:', idNumero)

  try {
    let finalUrlSaaS = (urlSaaS && urlSaaS !== 'null' && urlSaaS !== 'undefined') ? urlSaaS : null

    if (file) {
      finalUrlSaaS = await subirABlobYObtenerSAS(file)
    }

    let pool = await sql.connect(config)
    let request = pool.request()
      .input('ID', sql.Int, idNumero)
      .input('Proveedor', sql.NVarChar, proveedor || '')
      .input('Costo', sql.Decimal(10, 2), parseFloat(costo) || 0)
      .input('Categoria', sql.NVarChar, categoria || '')
      .input('Producto', sql.NVarChar, producto || '')
      .input('Proyecto', sql.NVarChar, proyecto || null)
      .input('PrecioUnitario', sql.Decimal(10, 2), parseFloat(precioUnitario) || 0)
      .input('Cantidad', sql.Int, parseInt(cantidad, 10) || 0)
      .input('URL_SaaS', sql.NVarChar, finalUrlSaaS)

    const fechaValida = (valorFechaFinal && String(valorFechaFinal).trim() !== '' && String(valorFechaFinal) !== 'null') 
      ? valorFechaFinal 
      : null
    request.input('FechaCompra', sql.Date, fechaValida)

    const queryFinal = `
      UPDATE Compras 
      SET Proveedor = @Proveedor, 
          Costo = @Costo, 
          Categoria = @Categoria, 
          Producto = @Producto, 
          Proyecto = @Proyecto,
          PrecioUnitario = @PrecioUnitario,
          Cantidad = @Cantidad,
          URL_SaaS = @URL_SaaS,
          FechaCompra = @FechaCompra
      WHERE Numero = @ID
    `

    const resultado = await request.query(queryFinal)
    console.log('Filas afectadas:', resultado.rowsAffected[0])

    res.json({ mensaje: 'Registro actualizado exitosamente', urlSaaS: finalUrlSaaS })
  } catch (error) {
    console.error('❌ Error al actualizar registro:', error.message)
    res.status(500).send(error.message)
  }
})

// Puerto de ejecución
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`🚀 Servidor Backend corriendo en puerto ${PORT}`)
})