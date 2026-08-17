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
  try { 
    let pool = await sql.connect(config)
    let r = await pool.request().query('SELECT * FROM Clientes ORDER BY NombreCliente ASC')
    res.json(r.recordset) 
  } catch (e) { res.status(500).send(e.message) }
})

app.post('/api/clientes', async (req, res) => {
  const { nombreCliente, rfc } = req.body
  try {
    let pool = await sql.connect(config)
    await pool.request()
      .input('N', nombreCliente)
      .input('R', rfc || null)
      .query('INSERT INTO Clientes (NombreCliente, RFC_TaxID) VALUES (@N, @R)')
    res.json({ mensaje: 'Guardado' })
  } catch (e) { res.status(500).send(e.message) }
})

// -------------------------------------------------------------
// 2. CONTACTOS DE CLIENTES
// -------------------------------------------------------------
app.get('/api/contactos', async (req, res) => {
  try { 
    let pool = await sql.connect(config)
    let r = await pool.request().query('SELECT ct.*, c.NombreCliente FROM ContactosClientes ct JOIN Clientes c ON ct.ClienteID = c.ClienteID')
    res.json(r.recordset) 
  } catch (e) { res.status(500).send(e.message) }
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
  try { 
    let pool = await sql.connect(config)
    let r = await pool.request().query('SELECT * FROM Ubicaciones')
    res.json(r.recordset) 
  } catch (e) { res.status(500).send(e.message) }
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
// 4. PROYECTOS (Actualizado con Soporte para ID Externo, Estatus y Edición PUT)
// -------------------------------------------------------------
app.get('/api/proyectos', async (req, res) => {
  try { 
    let pool = await sql.connect(config)
    // Se realiza un LEFT JOIN para traer opcionalmente el nombre del cliente si está vinculado por ubicación
    let r = await pool.request().query(`
      SELECT p.*, u.NombreUbicacion, c.NombreCliente, c.ClienteID 
      FROM Proyectos p 
      LEFT JOIN Ubicaciones u ON p.UbicacionID = u.UbicacionID 
      LEFT JOIN Clientes c ON u.ClienteID = c.ClienteID
    `)
    res.json(r.recordset) 
  } catch (e) { res.status(500).send(e.message) }
})

app.post('/api/proyectos', async (req, res) => {
  const { nombreProyecto, proyectoIdExterno, ubicacionID, descripcion, estatus } = req.body
  try {
    let pool = await sql.connect(config)
    await pool.request()
      .input('NombreProyecto', sql.NVarChar, nombreProyecto || '')
      .input('ProyectoID_Externo', sql.VarChar, proyectoIdExterno || null)
      .input('UbicacionID', sql.Int, ubicacionID ? parseInt(ubicacionID, 10) : null)
      .input('Descripcion', sql.NVarChar, descripcion || null)
      .input('Estatus', sql.VarChar, estatus || 'Activo')
      .query(`
        INSERT INTO Proyectos (NombreProyecto, ProyectoID_Externo, UbicacionID, Descripcion, Estatus) 
        VALUES (@NombreProyecto, @ProyectoID_Externo, @UbicacionID, @Descripcion, @Estatus)
      `)
    res.json({ mensaje: 'Proyecto registrado correctamente' })
  } catch (e) { res.status(500).send(e.message) }
})

app.put('/api/proyectos/:id', async (req, res) => {
  const { id } = req.params
  const { nombreProyecto, proyectoIdExterno, ubicacionID, descripcion, estatus } = req.body
  try {
    let pool = await sql.connect(config)
    await pool.request()
      .input('ID', parseInt(id, 10))
      .input('NombreProyecto', sql.NVarChar, nombreProyecto || '')
      .input('ProyectoID_Externo', sql.VarChar, proyectoIdExterno || null)
      .input('UbicacionID', sql.Int, ubicacionID ? parseInt(ubicacionID, 10) : null)
      .input('Descripcion', sql.NVarChar, descripcion || null)
      .input('Estatus', sql.VarChar, estatus || 'Activo')
      .query(`
        UPDATE Proyectos 
        SET NombreProyecto = @NombreProyecto, 
            ProyectoID_Externo = @ProyectoID_Externo, 
            UbicacionID = @UbicacionID, 
            Descripcion = @Descripcion, 
            Estatus = @Estatus 
        WHERE ProyectoID = @ID
      `)
    res.json({ mensaje: 'Proyecto actualizado correctamente' })
  } catch (e) { res.status(500).send(e.message) }
})

// -------------------------------------------------------------
// 5. COMPRAS
// -------------------------------------------------------------
app.get('/api/datos', async (req, res) => {
  try { 
    let pool = await sql.connect(config)
    let r = await pool.request().query('SELECT * FROM Compras ORDER BY FechaCreacion DESC')
    res.json(r.recordset) 
  } catch (e) { res.status(500).send(e.message) }
})

app.post('/api/compras', upload.single('archivo'), async (req, res) => {
  const { proveedor, costo, categoria, producto, proyecto, proyectoIdExterno, precioUnitario, cantidad, fechaCompra, estatus, material, notas } = req.body
  let finalUrl = req.file ? await subirABlobYObtenerSAS(req.file) : null
  
  const estatusCompra = estatus || 'Pedido'
  const estatusAlmacen = estatusCompra === 'Comprado' ? 'Pendiente' : null

  try {
    let pool = await sql.connect(config)
    let proyectoID = null

    if (proyecto && proyecto.trim() !== '') {
      let buscarProy = await pool.request()
        .input('Nombre', sql.NVarChar, proyecto.trim())
        .query('SELECT ProyectoID FROM Proyectos WHERE NombreProyecto = @Nombre')

      if (buscarProy.recordset.length > 0) {
        proyectoID = buscarProy.recordset[0].ProyectoID
      } else {
        let insertarProy = await pool.request()
          .input('Nombre', sql.NVarChar, proyecto.trim())
          .query('INSERT INTO Proyectos (NombreProyecto, Estatus) OUTPUT INSERTED.ProyectoID VALUES (@Nombre, \'Activo\')')
        proyectoID = insertarProy.recordset[0].ProyectoID
      }
    }

    await pool.request()
      .input('P', proveedor)
      .input('C', costo)
      .input('Cat', categoria)
      .input('Prod', producto)
      .input('ProyText', proyecto || null)
      .input('ProyID', proyectoID)
      .input('ProyExt', proyectoIdExterno || null)
      .input('Mat', material || null)
      .input('Not', notas || null)
      .input('PU', precioUnitario)
      .input('Cant', cantidad)
      .input('URL', finalUrl)
      .input('E', estatusCompra)
      .input('EA', estatusAlmacen)
      .input('F', fechaCompra)
      .query(`INSERT INTO Compras (Proveedor, Costo, Categoria, Producto, Proyecto, ProyectoID, ProyectoID_Externo, Material, Notas, PrecioUnitario, Cantidad, URL_SaaS, FechaCompra, Estatus, EstatusAlmacen, FechaCreacion) 
              VALUES (@P, @C, @Cat, @Prod, @ProyText, @ProyID, @ProyExt, @Mat, @Not, @PU, @Cant, @URL, @F, @E, @EA, CAST(GETDATE() AS DATE))`)
    
    res.json({ mensaje: 'Guardado' })
  } catch (e) { res.status(500).send(e.message) }
})

app.put('/api/compras/:id', upload.single('archivo'), async (req, res) => {
  const { id } = req.params
  const { proveedor, costo, categoria, producto, proyecto, proyectoIdExterno, precioUnitario, cantidad, fechaCompra, urlSaaS, estatus, material, notas } = req.body
  let finalUrl = req.file ? await subirABlobYObtenerSAS(req.file) : urlSaaS
  
  try {
    let pool = await sql.connect(config)
    let actual = await pool.request().input('ID', parseInt(id)).query('SELECT EstatusAlmacen FROM Compras WHERE Numero = @ID')
    let ea = actual.recordset[0]?.EstatusAlmacen
    
    if (estatus === 'Comprado' && (ea === null || ea === '')) {
      ea = 'Pendiente'
    }

    let proyectoID = null

    if (proyecto && proyecto.trim() !== '') {
      let buscarProy = await pool.request()
        .input('Nombre', sql.NVarChar, proyecto.trim())
        .query('SELECT ProyectoID FROM Proyectos WHERE NombreProyecto = @Nombre')

      if (buscarProy.recordset.length > 0) {
        proyectoID = buscarProy.recordset[0].ProyectoID
      } else {
        let insertarProy = await pool.request()
          .input('Nombre', sql.NVarChar, proyecto.trim())
          .query('INSERT INTO Proyectos (NombreProyecto, Estatus) OUTPUT INSERTED.ProyectoID VALUES (@Nombre, \'Activo\')')
        proyectoID = insertarProy.recordset[0].ProyectoID
      }
    }

    await pool.request()
      .input('ID', parseInt(id))
      .input('P', proveedor)
      .input('C', costo)
      .input('Cat', categoria)
      .input('Prod', producto)
      .input('ProyText', proyecto || null)
      .input('ProyID', proyectoID)
      .input('ProyExt', proyectoIdExterno || null)
      .input('Mat', material || null)
      .input('Not', notas || null)
      .input('PU', precioUnitario)
      .input('Cant', cantidad)
      .input('URL', finalUrl)
      .input('E', estatus)
      .input('EA', ea)
      .input('F', fechaCompra)
      .query(`UPDATE Compras SET Proveedor=@P, Costo=@C, Categoria=@Cat, Producto=@Prod, Proyecto=@ProyText, ProyectoID=@ProyID, ProyectoID_Externo=@ProyExt, Material=@Mat, Notas=@Not, PrecioUnitario=@PU, 
              Cantidad=@Cant, URL_SaaS=@URL, FechaCompra=@F, Estatus=@E, EstatusAlmacen=@EA WHERE Numero=@ID`)
    
    res.json({ mensaje: 'Actualizado' })
  } catch (e) { res.status(500).send(e.message) }
})

app.put('/api/compras/cancelar/:id', async (req, res) => {
  const { id } = req.params
  try {
    let pool = await sql.connect(config)
    await pool.request()
      .input('ID', parseInt(id))
      .query("UPDATE Compras SET Estatus = 'Cancelado' WHERE Numero = @ID")
    res.json({ mensaje: 'Cancelado correctamente' })
  } catch (e) { 
    res.status(500).send(e.message) 
  }
})

// -------------------------------------------------------------
// 6. INGENIERÍA
// -------------------------------------------------------------
app.get('/api/ingenieria', async (req, res) => {
  try { 
    let pool = await sql.connect(config)
    let r = await pool.request().query('SELECT * FROM Ingenieria ORDER BY FechaCreacion DESC')
    res.json(r.recordset) 
  } catch (e) { res.status(500).send(e.message) }
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
  try { 
    let pool = await sql.connect(config)
    let r = await pool.request().query('SELECT * FROM InventarioAlmacen ORDER BY ID DESC')
    res.json(r.recordset) 
  } catch (e) { res.status(500).send(e.message) }
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