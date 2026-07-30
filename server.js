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
      .input('Proyecto', sql.NVarChar, proyecto || null)                          // 🆕 NUEVO
      .input('PrecioUnitario', sql.Decimal(10, 2), parseFloat(precioUnitario) || 0) // 🆕 NUEVO
      .input('Cantidad', sql.Int, parseInt(cantidad, 10) || 0)                     // 🆕 NUEVO
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
      .input('Proyecto', sql.NVarChar, proyecto || null)                          // 🆕 NUEVO
      .input('PrecioUnitario', sql.Decimal(10, 2), parseFloat(precioUnitario) || 0) // 🆕 NUEVO
      .input('Cantidad', sql.Int, parseInt(cantidad, 10) || 0)                     // 🆕 NUEVO
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