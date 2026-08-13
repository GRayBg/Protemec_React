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

app.use(express.json())
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'], allowedHeaders: ['Content-Type', 'Authorization'] }))

const storage = multer.memoryStorage()
const upload = multer({ storage, limits: { fileSize: 200 * 1024 * 1024 } })

// Middleware para recibir el GLB y PDF en la sección de Ingeniería
const uploadIngenieria = upload.fields([
  { name: 'archivoGlb', maxCount: 1 },
  { name: 'archivoPdf', maxCount: 1 }
])

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: { encrypt: true, trustServerCertificate: false }
}

async function subirABlobYObtenerSAS(file) {
  if (!file) return null
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING
  const containerName = process.env.AZURE_CONTAINER_NAME
  if (!connectionString || !containerName) throw new Error("Faltan variables de Azure Blob Storage.")

  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
    const containerClient = blobServiceClient.getContainerClient(containerName)
    const nombreLimpio = file.originalname.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9.\-_]/g, '_')
    const blobName = `archivo_${Date.now()}_${nombreLimpio}`
    const blockBlobClient = containerClient.getBlockBlobClient(blobName)

    await blockBlobClient.uploadData(file.buffer, { blobHTTPHeaders: { blobContentType: file.mimetype || 'application/octet-stream' } })

    const accountName = blobServiceClient.accountName
    const matchKey = connectionString.match(/AccountKey=([^;]+)/)
    const accountKey = matchKey ? matchKey[1].replace(/["']/g, '').trim() : ''
    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey)

    const sasToken = generateBlobSASQueryParameters({
      containerName, blobName,
      permissions: BlobSASPermissions.parse("r"),
      startsOn: new Date(),
      expiresOn: new Date(new Date().valueOf() + 100 * 365 * 24 * 60 * 60 * 1000)
    }, sharedKeyCredential).toString()

    return `${blockBlobClient.url}?${sasToken}`
  } catch (err) {
    throw new Error(`Error Blob Storage: ${err.message}`)
  }
}

// -------------------------------------------------------------
// 1. CLIENTES
// -------------------------------------------------------------
app.get('/api/clientes', async (req, res) => {
  try {
    let pool = await sql.connect(config)
    let resultado = await pool.request().query('SELECT ClienteID, NombreCliente, RFC_TaxID, FechaCreacion FROM Clientes ORDER BY NombreCliente ASC')
    res.json(resultado.recordset)
  } catch (error) {
    res.status(500).send(error.message)
  }
})

app.post('/api/clientes', async (req, res) => {
  const { nombreCliente, rfc } = req.body
  try {
    let pool = await sql.connect(config)
    await pool.request()
      .input('NombreCliente', sql.NVarChar, nombreCliente || '')
      .input('RFC', sql.NVarChar, rfc || null)
      .query('INSERT INTO Clientes (NombreCliente, RFC_TaxID) VALUES (@NombreCliente, @RFC)')
    res.json({ mensaje: 'Cliente registrado correctamente' })
  } catch (error) {
    res.status(500).send(error.message)
  }
})

// -------------------------------------------------------------
// 2. CONTACTOS CLIENTES
// -------------------------------------------------------------
app.get('/api/contactos', async (req, res) => {
  try {
    let pool = await sql.connect(config)
    let query = `
      SELECT ct.ContactoID, ct.NombreContacto, ct.Puesto, ct.Telefono, ct.Email, 
             ct.ClienteID, c.NombreCliente, ct.UbicacionID, u.NombreUbicacion
      FROM ContactosClientes ct
      INNER JOIN Clientes c ON ct.ClienteID = c.ClienteID
      INNER JOIN Ubicaciones u ON ct.UbicacionID = u.UbicacionID
      ORDER BY c.NombreCliente, ct.NombreContacto ASC
    `
    let resultado = await pool.request().query(query)
    res.json(resultado.recordset)
  } catch (error) {
    res.status(500).send(error.message)
  }
})

app.post('/api/contactos', async (req, res) => {
  const { clienteID, ubicacionID, nombreContacto, puesto, telefono, email } = req.body
  try {
    let pool = await sql.connect(config)
    await pool.request()
      .input('ClienteID', sql.Int, parseInt(clienteID, 10))
      .input('UbicacionID', sql.Int, parseInt(ubicacionID, 10))
      .input('NombreContacto', sql.NVarChar, nombreContacto || '')
      .input('Puesto', sql.NVarChar, puesto || null)
      .input('Telefono', sql.NVarChar, telefono || null)
      .input('Email', sql.NVarChar, email || null)
      .query('INSERT INTO ContactosClientes (ClienteID, UbicacionID, NombreContacto, Puesto, Telefono, Email) VALUES (@ClienteID, @UbicacionID, @NombreContacto, @Puesto, @Telefono, @Email)')
    res.json({ mensaje: 'Contacto registrado correctamente' })
  } catch (error) {
    res.status(500).send(error.message)
  }
})

// -------------------------------------------------------------
// 3. UBICACIONES
// -------------------------------------------------------------
app.get('/api/ubicaciones', async (req, res) => {
  try {
    let pool = await sql.connect(config)
    let query = `
      SELECT u.UbicacionID, u.NombreUbicacion, u.Direccion, u.Ciudad, u.ClienteID, c.NombreCliente
      FROM Ubicaciones u
      INNER JOIN Clientes c ON u.ClienteID = c.ClienteID
      ORDER BY c.NombreCliente, u.NombreUbicacion ASC
    `
    let resultado = await pool.request().query(query)
    res.json(resultado.recordset)
  } catch (error) {
    res.status(500).send(error.message)
  }
})

app.post('/api/ubicaciones', async (req, res) => {
  const { clienteID, nombreUbicacion, direccion, ciudad } = req.body
  try {
    let pool = await sql.connect(config)
    await pool.request()
      .input('ClienteID', sql.Int, parseInt(clienteID, 10))
      .input('NombreUbicacion', sql.NVarChar, nombreUbicacion || '')
      .input('Direccion', sql.NVarChar, direccion || null)
      .input('Ciudad', sql.NVarChar, ciudad || null)
      .query('INSERT INTO Ubicaciones (ClienteID, NombreUbicacion, Direccion, Ciudad) VALUES (@ClienteID, @NombreUbicacion, @Direccion, @Ciudad)')
    res.json({ mensaje: 'Ubicación registrada correctamente' })
  } catch (error) {
    res.status(500).send(error.message)
  }
})

// -------------------------------------------------------------
// 4. PROYECTOS
// -------------------------------------------------------------
app.get('/api/proyectos', async (req, res) => {
  try {
    let pool = await sql.connect(config)
    let query = `
      SELECT p.ProyectoID, p.NombreProyecto, p.Estatus, p.UbicacionID, u.NombreUbicacion, c.ClienteID, c.NombreCliente
      FROM Proyectos p
      INNER JOIN Ubicaciones u ON p.UbicacionID = u.UbicacionID
      INNER JOIN Clientes c ON u.ClienteID = c.ClienteID
      ORDER BY p.NombreProyecto ASC
    `
    let resultado = await pool.request().query(query)
    res.json(resultado.recordset)
  } catch (error) {
    res.status(500).send(error.message)
  }
})

app.post('/api/proyectos', async (req, res) => {
  const { nombreProyecto, ubicacionID, descripcion } = req.body
  try {
    let pool = await sql.connect(config)
    await pool.request()
      .input('NombreProyecto', sql.NVarChar, nombreProyecto || '')
      .input('UbicacionID', sql.Int, parseInt(ubicacionID, 10))
      .input('Descripcion', sql.NVarChar, descripcion || null)
      .query('INSERT INTO Proyectos (NombreProyecto, UbicacionID, Descripcion) VALUES (@NombreProyecto, @UbicacionID, @Descripcion)')
    res.json({ mensaje: 'Proyecto registrado correctamente' })
  } catch (error) {
    res.status(500).send(error.message)
  }
})

// -------------------------------------------------------------
// 5. COMPRAS
// -------------------------------------------------------------
app.get('/api/datos', async (req, res) => {
  try {
    let pool = await sql.connect(config)
    let resultado = await pool.request().query('SELECT * FROM Compras ORDER BY FechaCreacion DESC')
    res.json(resultado.recordset)
  } catch (error) {
    res.status(500).send(error.message)
  }
})

app.post('/api/compras', upload.single('archivo'), async (req, res) => {
  const { proveedor, costo, categoria, producto, proyecto, precioUnitario, cantidad, fechaCompra, fecha, urlSaaS, estatus } = req.body
  const valorFechaFinal = fechaCompra || fecha
  const file = req.file

  try {
    let finalUrlSaaS = (urlSaaS && urlSaaS !== 'null' && urlSaaS !== 'undefined') ? urlSaaS : null
    if (file) finalUrlSaaS = await subirABlobYObtenerSAS(file)

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
      .input('Estatus', sql.NVarChar, estatus || 'Comprado')

    const fechaValida = (valorFechaFinal && String(valorFechaFinal).trim() !== '' && String(valorFechaFinal) !== 'null') ? valorFechaFinal : null
    request.input('FechaCompra', sql.Date, fechaValida)

    await request.query(`
      INSERT INTO Compras (Proveedor, Costo, Categoria, Producto, Proyecto, PrecioUnitario, Cantidad, URL_SaaS, FechaCompra, Estatus, FechaCreacion) 
      VALUES (@Proveedor, @Costo, @Categoria, @Producto, @Proyecto, @PrecioUnitario, @Cantidad, @URL_SaaS, @FechaCompra, @Estatus, CAST(GETDATE() AS DATE))
    `)

    res.json({ mensaje: 'Registro guardado exitosamente', urlSaaS: finalUrlSaaS })
  } catch (error) {
    res.status(500).send(error.message)
  }
})

app.put('/api/compras/:id', upload.single('archivo'), async (req, res) => {
  const { id } = req.params
  const { proveedor, costo, categoria, producto, proyecto, precioUnitario, cantidad, fechaCompra, fecha, urlSaaS, estatus } = req.body
  const valorFechaFinal = fechaCompra || fecha
  const file = req.file

  const idNumero = parseInt(id, 10)
  if (isNaN(idNumero)) return res.status(400).send('ID inválido.')

  try {
    let finalUrlSaaS = (urlSaaS && urlSaaS !== 'null' && urlSaaS !== 'undefined') ? urlSaaS : null
    if (file) finalUrlSaaS = await subirABlobYObtenerSAS(file)

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
      .input('Estatus', sql.NVarChar, estatus || 'Comprado')

    const fechaValida = (valorFechaFinal && String(valorFechaFinal).trim() !== '' && String(valorFechaFinal) !== 'null') ? valorFechaFinal : null
    request.input('FechaCompra', sql.Date, fechaValida)

    await request.query(`
      UPDATE Compras 
      SET Proveedor = @Proveedor, 
          Costo = @Costo, 
          Categoria = @Categoria, 
          Producto = @Producto, 
          Proyecto = @Proyecto,
          PrecioUnitario = @PrecioUnitario,
          Cantidad = @Cantidad,
          URL_SaaS = @URL_SaaS,
          FechaCompra = @FechaCompra,
          Estatus = @Estatus
      WHERE Numero = @ID
    `)

    res.json({ mensaje: 'Registro actualizado exitosamente', urlSaaS: finalUrlSaaS })
  } catch (error) {
    res.status(500).send(error.message)
  }
})

// -------------------------------------------------------------
// 6. INGENIERÍA Y DISEÑO (Estructura BOM + Seguimiento de Avance)
// -------------------------------------------------------------
app.get('/api/ingenieria', async (req, res) => {
  try {
    let pool = await sql.connect(config)
    let resultado = await pool.request().query('SELECT * FROM Ingenieria ORDER BY FechaCreacion DESC')
    res.json(resultado.recordset)
  } catch (error) {
    res.status(500).send(error.message)
  }
})

app.post('/api/ingenieria', uploadIngenieria, async (req, res) => {
  const { nombre, proyecto, tipoNivel, padreID, cantidadRequerida } = req.body
  const fileGlb = req.files && req.files['archivoGlb'] ? req.files['archivoGlb'][0] : null
  const filePdf = req.files && req.files['archivoPdf'] ? req.files['archivoPdf'][0] : null

  try {
    let urlGLB = null
    let urlPDF = null

    if (fileGlb) urlGLB = await subirABlobYObtenerSAS(fileGlb)
    if (filePdf) urlPDF = await subirABlobYObtenerSAS(filePdf)

    let pool = await sql.connect(config)
    await pool.request()
      .input('Nombre', sql.NVarChar, nombre || '')
      .input('Proyecto', sql.NVarChar, proyecto || '')
      .input('TipoNivel', sql.NVarChar, tipoNivel || 'Ensamble')
      .input('PadreID', sql.Int, padreID && padreID !== 'null' && padreID !== '' ? parseInt(padreID, 10) : null)
      .input('CantidadRequerida', sql.Int, parseInt(cantidadRequerida, 10) || 1)
      .input('CantidadLista', sql.Int, 0)
      .input('EstatusAvance', sql.NVarChar, 'Pendiente')
      .input('UrlGLB', sql.NVarChar, urlGLB)
      .input('UrlPDF', sql.NVarChar, urlPDF)
      .query(`
        INSERT INTO Ingenieria (Nombre, Proyecto, TipoNivel, PadreID, CantidadRequerida, CantidadLista, EstatusAvance, UrlGLB, UrlPDF, FechaCreacion)
        VALUES (@Nombre, @Proyecto, @TipoNivel, @PadreID, @CantidadRequerida, @CantidadLista, @EstatusAvance, @UrlGLB, @UrlPDF, GETDATE())
      `)

    res.json({ mensaje: 'Registro de ingeniería guardado correctamente', urlGLB, urlPDF })
  } catch (error) {
    res.status(500).send(error.message)
  }
})

// PUT: Actualizar la cantidad lista y cantidad requerida (recalculando estatus)
app.put('/api/ingenieria/:id/avance', async (req, res) => {
  const { id } = req.params
  const { cantidadLista, cantidadRequerida } = req.body

  const idNumero = parseInt(id, 10)
  if (isNaN(idNumero)) {
    return res.status(400).send('ID de pieza inválido.')
  }

  const cantLista = parseInt(cantidadLista, 10) || 0
  const cantReq = parseInt(cantidadRequerida, 10) || 1

  let estatus = 'Pendiente'
  if (cantLista >= cantReq) {
    estatus = 'Completado'
  } else if (cantLista > 0) {
    estatus = 'En Proceso'
  }

  try {
    let pool = await sql.connect(config)
    await pool.request()
      .input('ID', sql.Int, idNumero)
      .input('CantidadLista', sql.Int, cantLista)
      .input('CantidadRequerida', sql.Int, cantReq)
      .input('EstatusAvance', sql.NVarChar, estatus)
      .query(`
        UPDATE Ingenieria 
        SET CantidadLista = @CantidadLista,
            CantidadRequerida = @CantidadRequerida,
            EstatusAvance = @EstatusAvance
        WHERE ID = @ID
      `)

    res.json({ mensaje: 'Avance y requerimiento actualizados correctamente', estatus })
  } catch (error) {
    console.error('Error al actualizar avance:', error)
    res.status(500).send(`Error DB: ${error.message}`)
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => { console.log(`🚀 Servidor corriendo en puerto ${PORT}`) })