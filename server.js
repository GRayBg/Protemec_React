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
  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
  const containerClient = blobServiceClient.getContainerClient(containerName)
  const blobName = `archivo_${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`
  const blockBlobClient = containerClient.getBlockBlobClient(blobName)
  await blockBlobClient.uploadData(file.buffer, { blobHTTPHeaders: { blobContentType: file.mimetype } })

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
}

// -------------------------------------------------------------
// CRUD BÁSICO
// -------------------------------------------------------------
app.get('/api/clientes', async (req, res) => {
  try { let pool = await sql.connect(config); let r = await pool.request().query('SELECT * FROM Clientes ORDER BY NombreCliente ASC'); res.json(r.recordset) } 
  catch (e) { res.status(500).send(e.message) }
})

app.get('/api/contactos', async (req, res) => {
  try { let pool = await sql.connect(config); let r = await pool.request().query('SELECT ct.*, c.NombreCliente FROM ContactosClientes ct JOIN Clientes c ON ct.ClienteID = c.ClienteID'); res.json(r.recordset) } 
  catch (e) { res.status(500).send(e.message) }
})

app.get('/api/ubicaciones', async (req, res) => {
  try { let pool = await sql.connect(config); let r = await pool.request().query('SELECT * FROM Ubicaciones'); res.json(r.recordset) } 
  catch (e) { res.status(500).send(e.message) }
})

app.get('/api/proyectos', async (req, res) => {
  try { let pool = await sql.connect(config); let r = await pool.request().query('SELECT * FROM Proyectos'); res.json(r.recordset) } 
  catch (e) { res.status(500).send(e.message) }
})

// -------------------------------------------------------------
// COMPRAS
// -------------------------------------------------------------
app.get('/api/datos', async (req, res) => {
  try { let pool = await sql.connect(config); let r = await pool.request().query('SELECT * FROM Compras ORDER BY FechaCreacion DESC'); res.json(r.recordset) } 
  catch (e) { res.status(500).send(e.message) }
})

app.post('/api/compras', upload.single('archivo'), async (req, res) => {
  const { proveedor, costo, categoria, producto, proyecto, precioUnitario, cantidad, fechaCompra, estatus } = req.body
  let finalUrl = req.file ? await subirABlobYObtenerSAS(req.file) : null
  
  const estatusCompra = estatus || 'Pedido'
  const estatusAlmacen = estatusCompra === 'Comprado' ? 'Pendiente' : null

  try {
    let pool = await sql.connect(config)
    await pool.request()
      .input('P', proveedor).input('C', costo).input('Cat', categoria).input('Prod', producto)
      .input('Proy', proyecto).input('PU', precioUnitario).input('Cant', cantidad)
      .input('URL', finalUrl).input('E', estatusCompra).input('EA', estatusAlmacen).input('F', fechaCompra)
      .query(`INSERT INTO Compras (Proveedor, Costo, Categoria, Producto, Proyecto, PrecioUnitario, Cantidad, URL_SaaS, FechaCompra, Estatus, EstatusAlmacen, FechaCreacion) 
              VALUES (@P, @C, @Cat, @Prod, @Proy, @PU, @Cant, @URL, @F, @E, @EA, CAST(GETDATE() AS DATE))`)
    res.json({ mensaje: 'Guardado' })
  } catch (e) { res.status(500).send(e.message) }
})

app.put('/api/compras/:id', upload.single('archivo'), async (req, res) => {
  const { id } = req.params
  const { proveedor, costo, categoria, producto, proyecto, precioUnitario, cantidad, fechaCompra, urlSaaS, estatus } = req.body
  let finalUrl = req.file ? await subirABlobYObtenerSAS(req.file) : urlSaaS
  
  try {
    let pool = await sql.connect(config)
    let actual = await pool.request().input('ID', parseInt(id)).query('SELECT EstatusAlmacen FROM Compras WHERE Numero = @ID')
    let ea = actual.recordset[0]?.EstatusAlmacen
    
    // Si cambia a Comprado y no tenía estatus de almacén, lo ponemos en Pendiente
    if (estatus === 'Comprado' && (ea === null || ea === '')) {
      ea = 'Pendiente'
    }

    await pool.request()
      .input('ID', parseInt(id)).input('P', proveedor).input('C', costo).input('Cat', categoria)
      .input('Prod', producto).input('Proy', proyecto).input('PU', precioUnitario)
      .input('Cant', cantidad).input('URL', finalUrl).input('E', estatus).input('EA', ea).input('F', fechaCompra)
      .query(`UPDATE Compras SET Proveedor=@P, Costo=@C, Categoria=@Cat, Producto=@Prod, Proyecto=@Proy, PrecioUnitario=@PU, 
              Cantidad=@Cant, URL_SaaS=@URL, FechaCompra=@F, Estatus=@E, EstatusAlmacen=@EA WHERE Numero=@ID`)
    res.json({ mensaje: 'Actualizado' })
  } catch (e) { res.status(500).send(e.message) }
})

// -------------------------------------------------------------
// INGENIERÍA
// -------------------------------------------------------------
app.get('/api/ingenieria', async (req, res) => {
  try { let pool = await sql.connect(config); let r = await pool.request().query('SELECT * FROM Ingenieria ORDER BY FechaCreacion DESC'); res.json(r.recordset) } 
  catch (e) { res.status(500).send(e.message) }
})

// -------------------------------------------------------------
// ALMACÉN E INVENTARIO
// -------------------------------------------------------------
app.get('/api/inventario', async (req, res) => {
  try { let pool = await sql.connect(config); let r = await pool.request().query('SELECT * FROM InventarioAlmacen ORDER BY ID DESC'); res.json(r.recordset) } 
  catch (e) { res.status(500).send(e.message) }
})

app.post('/api/inventario/ingresar', async (req, res) => {
  const { compraID, modo, inventarioIDExistente, nombreProducto, ubicacion3D, cantidad } = req.body
  try {
    let pool = await sql.connect(config)
    let tx = new sql.Transaction(pool)
    await tx.begin()
    try {
      let targetID = inventarioIDExistente
      if (modo === 'nuevo' || !targetID) {
        let r = await tx.request()
          .input('N', nombreProducto).input('U', ubicacion3D).input('S', cantidad)
          .query('INSERT INTO InventarioAlmacen (NombreProducto, Ubicacion3D, Estado, CantidadStock) OUTPUT INSERTED.ID VALUES (@N, @U, \'Almacenado\', @S)')
        targetID = r.recordset[0].ID
      } else {
        await tx.request().input('ID', targetID).input('S', cantidad).input('U', ubicacion3D)
          .query('UPDATE InventarioAlmacen SET CantidadStock = CantidadStock + @S, Ubicacion3D = @U WHERE ID = @ID')
      }
      if (compraID) {
        await tx.request().input('CID', compraID).input('IID', targetID).input('C', cantidad)
          .query('INSERT INTO DetalleRecepcionCompras (CompraID, InventarioID, CantidadRecibida) VALUES (@CID, @IID, @C)')
        await tx.request().input('ID', compraID)
          .query("UPDATE Compras SET EstatusAlmacen = 'Recibido en Almacén' WHERE Numero = @ID")
      }
      await tx.commit()
      res.json({ success: true })
    } catch (err) { await tx.rollback(); throw err }
  } catch (e) { res.status(500).send(e.message) }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => { console.log(`🚀 Servidor en puerto ${PORT}`) })