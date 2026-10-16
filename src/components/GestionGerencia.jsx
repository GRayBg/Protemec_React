import { useMemo, useState } from 'react'

export default function GestionGerencia({
    compras = [],
    proyectos = [],
    disenos = [],
    personalRH = [],
    evaluacionesKPI = []
}) {
    const [filtroProyecto, setFiltroProyecto] = useState('TODOS')

    const comprasActivas = useMemo(
        () =>
            compras.filter((c) => {
                if ((c.Estatus || c.estatus) === 'Cancelado') return false
                if (filtroProyecto !== 'TODOS' && (c.Proyecto || c.proyecto) !== filtroProyecto) return false
                return true
            }),
        [compras, filtroProyecto]
    )

    const metricas = useMemo(() => {
        const gastoComprado = comprasActivas
            .filter((c) => (c.Estatus || c.estatus) === 'Comprado')
            .reduce((acc, c) => acc + (parseFloat(c.Costo ?? c.costo) || 0), 0)

        const montoCotizado = comprasActivas
            .filter((c) => (c.Estatus || c.estatus) === 'Cotizado')
            .reduce((acc, c) => acc + (parseFloat(c.Costo ?? c.costo) || 0), 0)

        // Agrupar gasto por Proyecto
        const mapaProyectos = {}
        comprasActivas.forEach((c) => {
            const p = c.Proyecto || c.proyecto || 'Sin Proyecto'
            const monto = parseFloat(c.Costo ?? c.costo) || 0
            mapaProyectos[p] = (mapaProyectos[p] || 0) + monto
        })
        const topProyectos = Object.entries(mapaProyectos)
            .map(([nombre, total]) => ({ nombre, total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 6)

        // Agrupar gasto por Proveedor
        const mapaProveedores = {}
        comprasActivas.forEach((c) => {
            const prov = c.Proveedor || c.proveedor || 'Otro'
            const monto = parseFloat(c.Costo ?? c.costo) || 0
            mapaProveedores[prov] = (mapaProveedores[prov] || 0) + monto
        })
        const topProveedores = Object.entries(mapaProveedores)
            .map(([nombre, total]) => ({ nombre, total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5)

        // Promedio general de KPIs de RH
        const promedioRH =
            evaluacionesKPI.length > 0
                ? (
                    evaluacionesKPI.reduce((acc, k) => acc + (parseFloat(k.PromedioGlobal) || 0), 0) /
                    evaluacionesKPI.length
                ).toFixed(1)
                : '—'

        return { gastoComprado, montoCotizado, topProyectos, topProveedores, promedioRH }
    }, [comprasActivas, evaluacionesKPI])

    const maxProyecto = Math.max(...metricas.topProyectos.map((p) => p.total), 1)
    const maxProveedor = Math.max(...metricas.topProveedores.map((p) => p.total), 1)

    const formatoMoneda = (val) =>
        new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val || 0)

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* FILTRO EJECUTIVO */}
            <div className="pro-card" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h3 style={{ fontSize: '15.5px', margin: 0 }}>📊 Tablero Ejecutivo de Dirección (Costos, Operaciones y KPIs)</h3>
                    <span style={{ fontSize: '12px', color: '#86868b' }}>
                        Análisis financiero en tiempo real conectado a Azure SQL
                    </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="pro-label" style={{ margin: 0 }}>Filtrar Proyecto:</span>
                    <select
                        value={filtroProyecto}
                        onChange={(e) => setFiltroProyecto(e.target.value)}
                        className="pro-select"
                        style={{ minWidth: '220px' }}
                    >
                        <option value="TODOS">Todos los Proyectos ({proyectos.length})</option>
                        {[...new Set(compras.map((c) => c.Proyecto).filter(Boolean))].map((proy, i) => (
                            <option key={i} value={proy}>{proy}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* KPI CARDS DE ALTO NIVEL */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <div className="pro-card" style={{ padding: '18px' }}>
                    <span style={{ fontSize: '11.5px', color: '#86868b', fontWeight: 700 }}>INVERSIÓN EJECUTADA (COMPRADO)</span>
                    <div className="pro-mono" style={{ fontSize: '24px', fontWeight: 800, color: '#059669', marginTop: '6px' }}>
                        {formatoMoneda(metricas.gastoComprado)}
                    </div>
                    <span style={{ fontSize: '11.5px', color: '#86868b' }}>Órdenes autorizadas y compradas</span>
                </div>

                <div className="pro-card" style={{ padding: '18px' }}>
                    <span style={{ fontSize: '11.5px', color: '#86868b', fontWeight: 700 }}>PRESUPUESTO EN COTIZACIÓN</span>
                    <div className="pro-mono" style={{ fontSize: '24px', fontWeight: 800, color: '#0071e3', marginTop: '6px' }}>
                        {formatoMoneda(metricas.montoCotizado)}
                    </div>
                    <span style={{ fontSize: '11.5px', color: '#86868b' }}>Partidas en estatus Cotizado</span>
                </div>

                <div className="pro-card" style={{ padding: '18px' }}>
                    <span style={{ fontSize: '11.5px', color: '#86868b', fontWeight: 700 }}>EFECTIVIDAD PROMEDIO RH (KPI)</span>
                    <div className="pro-mono" style={{ fontSize: '24px', fontWeight: 800, color: '#1d1d1f', marginTop: '6px' }}>
                        {metricas.promedioRH}{metricas.promedioRH !== '—' ? '%' : ''}
                    </div>
                    <span style={{ fontSize: '11.5px', color: '#059669', fontWeight: 600 }}>
                        {personalRH.filter((p) => p.Activo).length} colaboradores activos en planta
                    </span>
                </div>

                <div className="pro-card" style={{ padding: '18px' }}>
                    <span style={{ fontSize: '11.5px', color: '#86868b', fontWeight: 700 }}>INGENIERÍA Y PROYECTOS</span>
                    <div className="pro-mono" style={{ fontSize: '24px', fontWeight: 800, color: '#1d1d1f', marginTop: '6px' }}>
                        {proyectos.length} Proy. / {disenos.length} CAD
                    </div>
                    <span style={{ fontSize: '11.5px', color: '#86868b' }}>Componentes y ensambles BOM</span>
                </div>
            </div>

            {/* GRÁFICAS COMPARATIVAS DE COSTOS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '18px' }}>
                {/* GRÁFICA 1: COSTO POR PROYECTO */}
                <div className="pro-card" style={{ padding: '20px' }}>
                    <h4 style={{ fontSize: '14.5px', marginBottom: '16px' }}>💰 Distribución de Costos por Proyecto</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {metricas.topProyectos.map((item, idx) => {
                            const pct = Math.round((item.total / maxProyecto) * 100)
                            return (
                                <div key={idx}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
                                        <strong style={{ color: '#1d1d1f' }}>{item.nombre}</strong>
                                        <span className="pro-mono" style={{ fontWeight: 700 }}>{formatoMoneda(item.total)}</span>
                                    </div>
                                    <div style={{ width: '100%', height: '10px', backgroundColor: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                                        <div
                                            style={{
                                                width: `${pct}%`,
                                                height: '100%',
                                                background: 'linear-gradient(90deg, #0071e3, #38bdf8)',
                                                borderRadius: '999px'
                                            }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* GRÁFICA 2: TOP PROVEEDORES */}
                <div className="pro-card" style={{ padding: '20px' }}>
                    <h4 style={{ fontSize: '14.5px', marginBottom: '16px' }}>🏭 Volumen Financiero por Proveedor</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {metricas.topProveedores.map((item, idx) => {
                            const pct = Math.round((item.total / maxProveedor) * 100)
                            return (
                                <div key={idx}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
                                        <strong style={{ color: '#1d1d1f' }}>{item.nombre}</strong>
                                        <span className="pro-mono" style={{ fontWeight: 700 }}>{formatoMoneda(item.total)}</span>
                                    </div>
                                    <div style={{ width: '100%', height: '10px', backgroundColor: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                                        <div
                                            style={{
                                                width: `${pct}%`,
                                                height: '100%',
                                                background: 'linear-gradient(90deg, #059669, #34d399)',
                                                borderRadius: '999px'
                                            }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* RANKING DE RENDIMIENTO Y KPIS DEL PERSONAL */}
            <div className="pro-card" style={{ padding: '20px' }}>
                <h4 style={{ fontSize: '14.5px', marginBottom: '14px' }}>
                    🏆 Ranking de Efectividad y Rendimiento de Personal (RH KPIs)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
                    {personalRH
                        .filter((p) => p.Activo)
                        .map((emp) => {
                            const score = emp.PromedioHistoricoKPI ? Number(emp.PromedioHistoricoKPI).toFixed(1) : null
                            return (
                                <div
                                    key={emp.EmpleadoID}
                                    style={{
                                        padding: '14px',
                                        borderRadius: '12px',
                                        border: '1px solid var(--border-light)',
                                        backgroundColor: '#f8fafc',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '6px'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <strong style={{ fontSize: '13.5px' }}>{emp.NombreCompleto}</strong>
                                        <span
                                            className="pro-badge pro-mono"
                                            style={{
                                                backgroundColor: score >= 90 ? '#ecfdf5' : score ? '#fffbeb' : '#f1f5f9',
                                                color: score >= 90 ? '#065f46' : score ? '#92400e' : '#64748b',
                                                fontWeight: 800
                                            }}
                                        >
                                            {score ? `${score}%` : 'Sin KPI'}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '11.5px', color: '#86868b' }}>
                                        {emp.Departamento} · {emp.Puesto || 'Colaborador'}
                                    </div>
                                    <div style={{ width: '100%', height: '7px', backgroundColor: '#e2e8f0', borderRadius: '999px', overflow: 'hidden', marginTop: '4px' }}>
                                        <div
                                            style={{
                                                width: `${score || 0}%`,
                                                height: '100%',
                                                backgroundColor: score >= 90 ? '#10b981' : '#f59e0b'
                                            }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                </div>
            </div>
        </div>
    )
}