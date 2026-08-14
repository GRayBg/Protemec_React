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
// 1. CLIENTES
// -------------------------------------------------------------
app.get('/api/clientes', async (req, res) => {
  try { let pool = await sql.connect(config); let r = await pool.request().query('SELECT * FROM Clientes ORDER BY NombreCliente ASC'); res.json(r.recordset) } 
  catch (e) { res.status(500).send(e.message) }
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
  } catch (e) { res.status(500).send(e.message) }
})

// -------------------------------------------------------------
// 2. CONTACTOS
// -------------------------------------------------------------
app.get('/api/contactos', async (req, res) => {
  try { let pool = await sql.connect(config); let r = await pool.request().query('SELECT ct.*, c.NombreCliente FROM ContactosClientes ct JOIN Clientes c ON ct.ClienteID = c.ClienteID'); res.json(r.recordset) } 
  catch (e) { res.status(500).send(e.message) }
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
  } catch (e) { res.status(500).send(e.message) }
})

// -------------------------------------------------------------
// 3. UBICACIONES
// -------------------------------------------------------------
app.get('/api/ubicaciones', async (req, res) => {
  try { let pool = await sql.connect(config); let r = await pool.request().query('SELECT * FROM Ubicaciones'); res.json(r.recordset) } 
  catch (e) { res.status(500).send(e.message) }
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
  } catch (e) { res.status(500).send(e.message) }
})

// -------------------------------------------------------------
// 4. PROYECTOS
// -------------------------------------------------------------
app.get('/api/proyectos', async (req, res) => {
  try { let pool = await sql.connect(config); let r = await pool.request().query('SELECT * FROM Proyectos'); res.json(r.recordset) } 
  catch (e) { res.status(500).send(e.message) }
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
  } catch (e) { res.status(500).send(e.message) }
})

// -------------------------------------------------------------
// 5. COMPRAS
// -------------------------------------------------------------
app.get('/api/datos', async (req, res) => {
  try { let pool = await sql.connect(config); let r = await pool.request().query('SELECT * FROM Compras ORDER BY FechaCreacion DESC'); res.json(r.recordset) } 
  catch (e) { res.status(500).send(e.message) }
})

app.post('/api/compras', upload.single('archivo'), async (req, res) => {
  const { proveedor, costo, categoria, producto, proyecto, precioUnitario, cantidad, fechaCompra, fecha, urlSaaS, estatus } = req.body
  const valorFechaFinal = fechaCompra || fecha
  let finalUrl = (urlSaaS && urlSaaS !== 'null' && urlSaaS !== 'undefined') ? urlSaaS : null
  if (req.file) finalUrl = await subirABlobYObtenerSAS(req.file)

  try {
    let pool = await sql.connect(config)
    let request = pool.request()
      .input('Proveedor', sql.NVarChar, proveedor || '')
      .input('Costo', sql.Decimal(10, 2), parseFloat(costo) || 0)
      .input('Categoria', sql.NVarChar, categoria || '')
      .input('Producto', sql.NVarChar, producto || '')
      .input('Proyecto', sql.NVarChar, proyecto || null)
      .input('PrecioUnitario', sql.Decimal(10, 2), parseFloat(precioUnitario) || 0)
      .input('Cantidad', sql.Int, parseInt(cantidad, 10) || 0)
      .input('URL_SaaS', sql.NVarChar, finalUrl)
      .input('Estatus', sql.NVarChar, estatus || 'Comprado')

    const fechaValida = (valorFechaFinal && String(valorFechaFinal).trim() !== '' && String(valorFechaFinal) !== 'null') ? valorFechaFinal : null
    request.input('FechaCompra', sql.Date, fechaValida)

    await request.query(`
      INSERT INTO Compras (Proveedor, Costo, Categoria, Producto, Proyecto, PrecioUnitario, Cantidad, URL_SaaS, FechaCompra, Estatus, EstatusAlmacen, FechaCreacion) 
      VALUES (@Proveedor, @Costo, @Categoria, @Producto, @Proyecto, @PrecioUnitario, @Cantidad, @URL_SaaS, @FechaCompra, @Estatus, 'Pendiente', CAST(GETDATE() AS DATE))
    `)

    res.json({ mensaje: 'Registro guardado exitosamente', urlSaaS: finalUrl })
  } catch (e) { res.status(500).send(e.message) }
})

app.put('/api/compras/:id', upload.single('archivo'), async (req, res) => {
  const { id } = req.params
  const { proveedor, costo, categoria, producto, proyecto, precioUnitario, cantidad, fechaCompra, fecha, urlSaaS, estatus } = req.body
  const valorFechaFinal = fechaCompra || fecha
  let finalUrl = (urlSaaS && urlSaaS !== 'null' && urlSaaS !== 'undefined') ? urlSaaS : null
  if (req.file) finalUrl = await subirABlobYObtenerSAS(req.file)

  const idNumero = parseInt(id, 10)
  if (isNaN(idNumero)) return res.status(400).send('ID inválido.')

  try {
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
      .input('URL_SaaS', sql.NVarChar, finalUrl)
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

    res.json({ mensaje: 'Registro actualizado exitosamente', urlSaaS: finalUrl })
  } catch (e) { res.status(500).send(e.message) }
})

// -------------------------------------------------------------
// 6. INGENIERÍA
// -------------------------------------------------------------
app.get('/api/ingenieria', async (req, res) => {
  try { let pool = await sql.connect(config); let r = await pool.request().query('SELECT * FROM Ingenieria ORDER BY FechaCreacion DESC'); res.json(r.recordset) } 
  catch (e) { res.status(500).send(e.message) }
})

app.post('/api/ingenieria', uploadIngenieria, async (req, res) => {
  const { nombre, proyecto, cantidadRequerida } = req.body
  let urlGLB = req.files?.archivoGlb ? await subirABlobYObtenerSAS(req.files.archivoGlb[0]) : null
  try {
    let pool = await sql.connect(config)
    await pool.request()
      .input('N', nombre).input('P', proyecto).input('CR', cantidadRequerida).input('GLB', urlGLB)
      .query('INSERT INTO Ingenieria (Nombre, Proyecto, CantidadRequerida, UrlGLB, EstatusAvance, FechaCreacion) VALUES (@N, @P, @CR, @GLB, \'Pendiente\', GETDATE())')
    res.json({ mensaje: 'Guardado' })
  } catch (e) { res.status(500).send(e.message) }
})

// -------------------------------------------------------------
// 7. ALMACÉN E INVENTARIO
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

app.put('/api/inventario/:id', async (req, res) => {
  const { id } = req.params
  const { estado, cantidadStock, ubicacion3D } = req.body
  try {
    let pool = await sql.connect(config)
    let reqSql = pool.request().input('ID', parseInt(id))
    let sets = []
    if (estado) { reqSql.input('E', estado); sets.push('Estado = @E') }
    if (cantidadStock !== undefined) { reqSql.input('S', cantidadStock); sets.push('CantidadStock = @S') }
    if (ubicacion3D) { reqSql.input('U', ubicacion3D); sets.push('Ubicacion3D = @U') }
    
    await reqSql.query(`UPDATE InventarioAlmacen SET ${sets.join(', ')} WHERE ID = @ID`)
    res.json({ success: true })
  } catch (e) { res.status(500).send(e.message) }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => { console.log(`🚀 Servidor en puerto ${PORT}`) })