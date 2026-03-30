import { SimuladordosComponent } from './componentes/pliego24/simuladordos/simuladordos.component';
import { SimuladortresComponent } from './componentes/pliego24/simuladortres/simuladortres.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
// import { AppComponent } from './app.component';

import { ContentWrapperComponent } from './content-wrapper/content-wrapper.component';

//========Consumo de Agua =====
import { ClientesComponent } from './componentes/clientes/clientes/clientes.component';
import { AddClienteComponent } from './componentes/clientes/add-clientes/add-cliente.component';
import { ModificarClientesComponent } from './componentes/clientes/modificar-clientes/modificar-clientes.component';
import { DetallesClienteComponent } from './componentes/clientes/detalles-cliente/detalles-cliente.component';
import { BuscarClienteComponent } from './componentes/clientes/buscar-cliente/buscar-cliente.component';

import { AddAbonadosComponent } from './componentes/abonados/add-abonados/add-abonados.component';
import { ListarAbonadosComponent } from './componentes/abonados/listar-abonados/listar-abonados.component';
import { ModificarAbonadosComponent } from './componentes/abonados/modificar-abonados/modificar-abonados.component';
import { DetallesAbonadoComponent } from './componentes/abonados/detalles-abonado/detalles-abonado.component';

import { SuspensionesComponent } from './componentes/suspensiones/suspensiones/suspensiones.component';
import { AddSuspensionesComponent } from './componentes/suspensiones/add-suspensiones/add-suspensiones.component';
import { DetallesSuspensionesComponent } from './componentes/suspensiones/detalles-suspensiones/detalles-suspensiones.component';
import { HabilitacionesComponent } from './componentes/habilitaciones/habilitaciones/habilitaciones.component';
//Rutas
import { RutasComponent } from './componentes/rutas/rutas/rutas.component';
import { AddRutasComponent } from './componentes/rutas/add-rutas/add-rutas.component';
//Emisiones
import { EmisionesComponent } from './componentes/emisiones/emisiones/emisiones.component';
import { AddEmisionComponent } from './componentes/emisiones/add-emision/add-emision.component';
import { ModiEmisionComponent } from './componentes/emisiones/modi-emision/modi-emision.component';
import { GeneEmisionComponent } from './componentes/emisiones/gene-emision/gene-emision.component';
import { RutasxemisionComponent } from './componentes/rutasxemision/rutasxemision/rutasxemision.component'; //OJO: Se usa?
import { EmiactualComponent } from './componentes/rutasxemision/emiactual/emiactual.component'; //OJO: Se usa?
//Pliego Tarifario
import { AddPreciosxcatComponent } from './componentes/preciosxcat/add-preciosxcat/add-preciosxcat.component';
import { ModificarPreciosxcatComponent } from './componentes/preciosxcat/modificar-preciosxcat/modificar-preciosxcat.component';
import { PreciosxcatComponent } from './componentes/preciosxcat/preciosxcat/preciosxcat.component';
import { InfoPreciosxcatComponent } from './componentes/preciosxcat/info-preciosxcat/info-preciosxcat.component';
import { Pliego24Component } from './componentes/pliego24/pliego24/pliego24.component';
import { SimulacionComponent } from './componentes/pliego24/simulacion/simulacion.component';
import { ProyeccionComponent } from './componentes/pliego24/proyeccion/proyeccion.component';

// ============ FACTURACION ======================
import { FacturacionComponent } from './componentes/facturacion/facturacion/facturacion.component';
import { InfoFacturacionComponent } from './componentes/facturacion/info-facturacion/info-facturacion.component';
import { AddFacturacionComponent } from './componentes/facturacion/add-facturacion/add-facturacion.component';
import { AnulacionesBajasComponent } from './componentes/facturas/anulaciones-bajas/anulaciones-bajas.component';
//Catalogoitems (Productos)
import { CatalogoitemsComponent } from './componentes/catalogoitems/catalogoitems/catalogoitems.component';
import { InfoCatalogoitemsComponent } from './componentes/catalogoitems/info-catalogoitems/info-catalogoitems.component';
import { AddCatalogoitemsComponent } from './componentes/catalogoitems/add-catalogoitems/add-catalogoitems.component';
import { ModiCatalogoitemsComponent } from './componentes/catalogoitems/modi-catalogoitems/modi-catalogoitems.component';
//Usoitems (Usos)
import { UsoitemsComponent } from './componentes/usoitems/usoitems/usoitems.component';
import { InfoUsoitemsComponent } from './componentes/usoitems/info-usoitems/info-usoitems.component';
import { AddUsoitemsComponent } from './componentes/usoitems/add-usoitems/add-usoitems.component';
import { ModiUsoitemsComponent } from './componentes/usoitems/modi-usoitems/modi-usoitems.component';
//Rubros (de las planillas)
import { RubrosComponent } from './componentes/rubros/rubros/rubros.component';
import { InfoRubroComponent } from './componentes/rubros/info-rubro/info-rubro.component';
import { AddRubroComponent } from './componentes/rubros/add-rubro/add-rubro.component';
import { ModiRubroComponent } from './componentes/rubros/modi-rubro/modi-rubro.component';

//========= TRÁMITES ==========
import { InfoTramiteComponent } from './componentes/ctramites/info-tramite/info-tramite.component';

import { AddTramiteComponent } from './componentes/ctramites/add-tramite/add-tramite.component';

import { ListarCertificacionesComponent } from './componentes/ccertificaciones/listar-certificaciones/certificaciones.component';
import { ModificarCertificacionesComponent } from './componentes/ccertificaciones/modificar-certificaciones/modificar-certificaciones.component';
import { AddCertificacionesComponent } from './componentes/ccertificaciones/add-certificaciones/add-certificaciones.component';
import { GeneCertificacionComponent } from './componentes/ccertificaciones/gene-certificacion/gene-certificacion.component';
import { AguatramComponent } from './componentes/aguatramite/aguatram/aguatram.component';

//Recaudacion
import { ConveniosComponent } from './componentes/convenios/convenios/convenios.component';
import { ModiConvenioComponent } from './componentes/convenios/modi-convenio/modi-convenio.component';
import { ListarCajaComponent } from './componentes/caja/cajas/cajas.component';
import { AddCajaComponent } from './componentes/caja/add-caja/add-caja.component';
import { ModificarCajaComponent } from './componentes/caja/modificar-caja/modificar-caja.component';
import { InfoCajaComponent } from './componentes/caja/info-caja/info-caja.component';

import { AddPtoemisionComponent } from './componentes/ptoemision/add-ptoemision/add-ptoemision.component';
import { ListarPtoemisionComponent } from './componentes/ptoemision/listar-ptoemision/listar-ptoemision.component';
import { ModificarPtoemisionComponent } from './componentes/ptoemision/modificar-ptoemision/modificar-ptoemision.component';
//import { InfoPtoemisionComponent } from './componentes/ptoemision/info-ptoemision/info-ptoemision.component';
import { ListarCategoriaComponent } from './componentes/categoria/categorias/categorias.component';
import { AddCategoriaComponent } from './componentes/categoria/add-categoria/add-categoria.component';
import { ModificarCategoriaComponent } from './componentes/categoria/modi-categoria/modi-categoria.component';
//Intereses
import { AddInteresesComponent } from './componentes/intereses/add-intereses/add-intereses.component';
import { ListarInteresesComponent } from './componentes/intereses/intereses/intereses.component';
import { ModificarInteresesComponent } from './componentes/intereses/modificar-intereses/modificar-intereses.component';
import { ImporInteresesComponent } from './componentes/intereses/impor-intereses/impor-intereses.component';

import { LecturasComponent } from './componentes/lecturas/lecturas.component';
import { ImporLecturasComponent } from './componentes/lecturas/impor-lecturas/impor-lecturas.component';
import { ListarReclamosComponent } from './componentes/reclamos/listar-reclamos/listar-reclamos.component';
import { AddReclamosComponent } from './componentes/reclamos/add-reclamos/add-reclamos.component';
import { ModificarReclamosComponent } from './componentes/reclamos/modificar-reclamos/modificar-reclamos.component';
import { UbicacionmComponent } from './componentes/ubicacionm/ubicacionm/ubicacionm.component';
import { AddUbicacionmComponent } from './componentes/ubicacionm/add-ubicacionm/add-ubicacionm.component';
import { Tramites1Component } from './componentes/tramites1/tramites1/tramites1.component';
import { AddTramites1Component } from './componentes/tramites1/add-tramites1/add-tramites1.component';
import { AguatramiteComponent } from './componentes/aguatramite/aguatramite/aguatramite.component';
import { InfoAguatramiteComponent } from './componentes/aguatramite/info-aguatramite/info-aguatramite.component';
import { FacturasComponent } from './componentes/facturas/facturas/facturas.component';
import { InfoFacturasComponent } from './componentes/facturas/info-facturas/info-factura.component';
import { FacelectroComponent } from './componentes/facelectro/facelectro/facelectro.component';
import { InfoConvenioComponent } from './componentes/convenios/info-convenio/info-convenio.component';
import { InfoEstablecimientoComponent } from './componentes/ptoemision/info-establecimiento/info-establecimiento.component';
import { RecaudacionComponent } from './componentes/recaudacion/recaudacion/recaudacion.component';
import { AddRecaudaComponent } from './componentes/recaudacion/add-recauda/add-recauda.component';
import { InfoRutaComponent } from './componentes/rutas/info-ruta/info-ruta.component';
//============= Catálogos ======================
import { ListarEstadomComponent } from './componentes/estadom/listar-estadom/listar-estadom.component';
import { ListarNovedadesComponent } from './componentes/novedad/listar-novedades/listar-novedades.component';
import { AddNovedadComponent } from './componentes/novedad/add-novedad/add-novedad.component';
import { NovedadDetalleComponent } from './componentes/novedad/novedad-detalle/novedad-detalle.component';
import { ListarNacionalidadComponent } from './componentes/nacionalidad/listar-nacionalidad/listar-nacionalidad.component';
import { AddNacionalidadComponent } from './componentes/nacionalidad/add-nacionalidad/add-nacionalidad.component';
import { ModificarNacionalidadComponent } from './componentes/nacionalidad/modificar-nacionalidad/modificar-nacionalidad.component';
import { TpidentificasComponent } from './componentes/tpidentifica/tpidentificas/tpidentificas.component';
import { ListarTipopagoComponent } from './componentes/tipopago/listar-tipopago/listar-tipopago.component';
import { TpreclamosComponent } from './componentes/tpreclamos/tpreclamos/tpreclamos.component';
import { ModiUbicacionmComponent } from './componentes/ubicacionm/modi-ubicacionm/modi-ubicacionm.component';

// =================== CONTABILIDAD =============================
import { CuentasComponent } from './componentes/contabilidad/cuentas/cuentas/cuentas.component';
import { AddCuentaComponent } from './componentes/contabilidad/cuentas/add-cuenta/add-cuenta.component';

import { AsientosComponent } from './componentes/contabilidad/asientos/asientos/asientos.component';
import { AddAsientoComponent } from './componentes/contabilidad/asientos/add-asiento/add-asiento.component';

import { TransaciComponent } from './componentes/contabilidad/transaci/transaci/transaci.component';
import { AddTransaciComponent } from './componentes/contabilidad/transaci/add-transaci/add-transaci.component';
import { AddBenextranComponent } from './componentes/contabilidad/transaci/add-benextran/add-benextran.component';
import { AddLiquiacfpComponent } from './componentes/contabilidad/transaci/add-liquiacfp/add-liquiacfp.component';

import { SinafipComponent } from './componentes/contabilidad/sinafip/sinafip/sinafip.component';

import { NiifcuentasComponent } from './componentes/contabilidad/niifcuentas/niifcuentas/niifcuentas.component';
import { AddHomologaComponent } from './componentes/contabilidad/niifcuentas/add-homologa/add-homologa.component';
import { AddNiifcuentaComponent } from './componentes/contabilidad/niifcuentas/add-niifcuenta/add-niifcuenta.component';
import { ModiNiifcuentaComponent } from './componentes/contabilidad/niifcuentas/modi-niifcuenta/modi-niifcuenta.component';

import { PreingresosComponent } from './componentes/contabilidad/preingresos/preingresos/preingresos.component';
import { AddPreingresoComponent } from './componentes/contabilidad/preingresos/add-preingreso/add-preingreso.component';
import { ModiPreingresoComponent } from './componentes/contabilidad/preingresos/modi-preingreso/modi-preingreso.component';
import { AuxIngresoComponent } from './componentes/contabilidad/preingresos/aux-ingreso/aux-ingreso.component';

import { PregastosComponent } from './componentes/contabilidad/pregastos/pregastos/pregastos.component';
import { AddPregastoComponent } from './componentes/contabilidad/pregastos/add-pregasto/add-pregasto.component';
import { ModiPregastoComponent } from './componentes/contabilidad/pregastos/modi-pregasto/modi-pregasto.component';
import { AuxGastoComponent } from './componentes/contabilidad/pregastos/aux-gasto/aux-gasto.component';

import { CertipresuComponent } from './componentes/contabilidad/certipresu/certipresu/certipresu.component';
import { ModiCertipresuComponent } from './componentes/contabilidad/certipresu/modi-certipresu/modi-certipresu.component';
import { AddCertipresuComponent } from './componentes/contabilidad/certipresu/add-certipresu/add-certipresu.component';
import { PartixcertiComponent } from './componentes/contabilidad/partixcerti/partixcerti/partixcerti.component';

import { TramipresuComponent } from './componentes/contabilidad/tramipresu/tramipresu/tramipresu.component';
import { AddTramipresuComponent } from './componentes/contabilidad/tramipresu/add-tramipresu/add-tramipresu.component';
import { ModiTramipresuComponent } from './componentes/contabilidad/tramipresu/modi-tramipresu/modi-tramipresu.component';

import { ReformasComponent } from './componentes/contabilidad/reformas/reformas/reformas.component';
import { AddReformaComponent } from './componentes/contabilidad/reformas/add-reforma/add-reforma.component';
import { ModiReformaComponent } from './componentes/contabilidad/reformas/modi-reforma/modi-reforma.component';

import { ClasificadorComponent } from './componentes/contabilidad/clasificador/clasificador/clasificador.component';
import { InfoClasificadorComponent } from './componentes/contabilidad/clasificador/info-clasificador/info-clasificador.component';
import { ModiClasificadorComponent } from './componentes/contabilidad/clasificador/modi-clasificador/modi-clasificador.component';
import { AddClasificadorComponent } from './componentes/contabilidad/clasificador/add-clasificador/add-clasificador.component';

import { EjecucionComponent } from './componentes/contabilidad/ejecucion/ejecucion/ejecucion.component';
import { ModiEjecucionComponent } from './componentes/contabilidad/ejecucion/modi-ejecucion/modi-ejecucion.component';
import { AddEjecucionComponent } from './componentes/contabilidad/ejecucion/add-ejecucion/add-ejecucion.component';

import { BancosComponent } from './componentes/contabilidad/bancos/bancos/bancos.component';
import { ConciliabanComponent } from './componentes/contabilidad/bancos/conciliaban/conciliaban.component';

import { EstrfuncComponent } from './componentes/contabilidad/estrfunc/estrfunc/estrfunc.component';
import { InfoEstrfuncComponent } from './componentes/contabilidad/estrfunc/info-estrfunc/info-estrfunc.component';

// ============ ADMINISTRACION CENTRAL ==========================
import { Tabla4Component } from './features/admin-central/pages/administracion/tabla4/tabla4/tabla4.component';
import { AddTabla4Component } from './features/admin-central/pages/administracion/tabla4/add-tabla4/add-tabla4.component';
import { InfoTabla4Component } from './features/admin-central/pages/administracion/tabla4/info-tabla4/info-tabla4.component';
import { ModiTabla4Component } from './features/admin-central/pages/administracion/tabla4/modi-tabla4/modi-tabla4.component';

// import { LoginComponent } from './compartida/login/login.component';

import { DocumentosComponent } from './features/admin-central/pages/administracion/documentos/documentos/documentos.component';
import { AddDocumentoComponent } from './features/admin-central/pages/administracion/documentos/add-documento/add-documento.component';
import { InfoDocumentoComponent } from './features/admin-central/pages/administracion/documentos/info-documento/info-documento.component';
import { ModiDocumentoComponent } from './features/admin-central/pages/administracion/documentos/modi-documento/modi-documento.component';

import { UsuariosComponent } from './features/admin-central/pages/administracion/usuarios/usuarios/usuarios.component';
import { ModiUsuarioComponent } from './features/admin-central/pages/administracion/usuarios/modi-usuario/modi-usuario.component';

import { ColoresComponent } from './features/admin-central/pages/administracion/colores/colores.component';
import { CertitmpComponent } from './componentes/ccertificaciones/certitmp/certitmp.component';
import { TransferenciasComponent } from './componentes/recaudacion/transferencias/transferencias.component';
import { PerfilUsuarioComponent } from './features/admin-central/pages/administracion/usuarios/perfil-usuario/perfil-usuario.component';
import { RecalFacturaComponent } from './componentes/facturas/recal-factura/recal-factura.component';
import { AddConvenioComponent } from './componentes/convenios/add-convenio/add-convenio.component';
import { GeneradorxmlComponent } from './componentes/facelectro/generadorxml/generadorxml.component';
import { ImpLecturasComponent } from './componentes/lecturas/imp-lecturas/imp-lecturas.component';
import { ImpCajasComponent } from './componentes/caja/imp-cajas/imp-cajas.component';
import { ImpInfoCajasComponent } from './componentes/caja/info-caja/imp-info-cajas/imp-info-cajas.component';
import { FecfacturaComponent } from './componentes/facelectro/fecfactura/fecfactura.component';
import { TramitesComponent } from './componentes/ctramites/tramites/tramites.component';
import { RutasmorasComponent } from './componentes/suspensiones/rutasmoras/rutasmoras.component';
import { ImpInfoclienteComponent } from './componentes/clientes/imp-infocliente/imp-infocliente.component';
import { ImpClienteComponent } from './componentes/clientes/imp-cliente/imp-cliente.component';
import { ImpEmisionesComponent } from './componentes/emisiones/imp-emisiones/imp-emisiones.component';
import { CvRubrosComponent } from './componentes/coactivas/carteras-vencidas/cv-rubros/cv-rubros.component';
import { CvFacturasComponent } from './componentes/coactivas/carteras-vencidas/cv-facturas/cv-facturas.component';
import { ModiCuentaComponent } from './componentes/contabilidad/cuentas/modi-cuenta/modi-cuenta.component';
import { InfoCuentaComponent } from './componentes/contabilidad/cuentas/info-cuenta/info-cuenta.component';
import { ImpCuentasComponent } from './componentes/contabilidad/cuentas/imp-cuentas/imp-cuentas.component';
import { ImpMayorComponent } from './componentes/contabilidad/cuentas/imp-mayor/imp-mayor.component';
import { ImpAsientosComponent } from './componentes/contabilidad/asientos/imp-asientos/imp-asientos.component';
import { ModiAsientoComponent } from './componentes/contabilidad/asientos/modi-asiento/modi-asiento.component';
import { ModiTransaciComponent } from './componentes/contabilidad/transaci/modi-transaci/modi-transaci.component';
import { ImpTransaciComponent } from './componentes/contabilidad/transaci/imp-transaci/imp-transaci.component';
import { ImpBancosComponent } from './componentes/contabilidad/bancos/imp-bancos/imp-bancos.component';
import { ImpNiifcuentasComponent } from './componentes/contabilidad/niifcuentas/imp-niifcuentas/imp-niifcuentas.component';
import { BeneficiariosComponent } from './componentes/contabilidad/beneficiarios/beneficiarios/beneficiarios.component';
import { AddBeneficiarioComponent } from './componentes/contabilidad/beneficiarios/add-beneficiario/add-beneficiario.component';
import { InfoBeneficiarioComponent } from './componentes/contabilidad/beneficiarios/info-beneficiario/info-beneficiario.component';
import { ModiBeneficiarioComponent } from './componentes/contabilidad/beneficiarios/modi-beneficiario/modi-beneficiario.component';
import { ImpBeneficiariosComponent } from './componentes/contabilidad/beneficiarios/imp-beneficiarios/imp-beneficiarios.component';
import { ImpMovibeneComponent } from './componentes/contabilidad/beneficiarios/imp-movibene/imp-movibene.component';
import { InfoLiquidaComponent } from './componentes/contabilidad/beneficiarios/info-beneficiario/info-liquida/info-liquida/info-liquida.component';
import { ImpLiquidaComponent } from './componentes/contabilidad/beneficiarios/info-beneficiario/info-liquida/imp-liquida/imp-liquida.component';
import { EgresosComponent } from './componentes/contabilidad/egresos/egresos/egresos.component';
import { ModiEgresoComponent } from './componentes/contabilidad/egresos/modi-egreso/modi-egreso.component';
import { ImpEgresosComponent } from './componentes/contabilidad/egresos/imp-egresos/imp-egresos.component';
import { AddEgresoComponent } from './componentes/contabilidad/egresos/add-egreso/add-egreso.component';
import { RegrecaudaComponent } from './componentes/contabilidad/regrecauda/regrecauda/regrecauda.component';
import { RetencionesComponent } from './componentes/contabilidad/retenciones/retenciones/retenciones.component';
import { ImpRetencionesComponent } from './componentes/contabilidad/retenciones/imp-retenciones/imp-retenciones.component';
import { AddRetencionComponent } from './componentes/contabilidad/retenciones/add-retencion/add-retencion.component';
import { ModiRetencionComponent } from './componentes/contabilidad/retenciones/modi-retencion/modi-retencion.component';
import { ImpPreingresoComponent } from './componentes/contabilidad/preingresos/imp-preingreso/imp-preingreso.component';
import { ImpAuxingresoComponent } from './componentes/contabilidad/preingresos/imp-auxingreso/imp-auxingreso.component';
import { ImpPregastoComponent } from './componentes/contabilidad/pregastos/imp-pregasto/imp-pregasto.component';
import { ImpAuxgastoComponent } from './componentes/contabilidad/pregastos/imp-auxgasto/imp-auxgasto.component';
import { PrmisoxtramiComponent } from './componentes/contabilidad/tramipresu/prmisoxtrami/prmisoxtrami.component';
import { ComprobacionComponent } from './componentes/contabilidad/comprobacion/comprobacion.component';
import { EstFinancieraComponent } from './componentes/contabilidad/est-financiera/est-financiera.component';
import { EstResultadosComponent } from './componentes/contabilidad/est-resultados/est-resultados.component';
import { EstFlujoEfeComponent } from './componentes/contabilidad/est-flujo-efe/est-flujo-efe.component';
import { EstEjecucionPreComponent } from './componentes/contabilidad/est-ejecucion-pre/est-ejecucion-pre.component';
import { UnicostosComponent } from './componentes/contabilidad/costos/unicostos/unicostos.component';
import { CuecostosComponent } from './componentes/contabilidad/costos/cuecostos/cuecostos.component';
import { ComparativoComponent } from './componentes/contabilidad/costos/comparativo/comparativo.component';
import { ResulcostosComponent } from './componentes/contabilidad/costos/resulcostos/resulcostos.component';
import { ImpUnicostosComponent } from './componentes/contabilidad/costos/imp-unicostos/imp-unicostos.component';
import { IfinanComponent } from './componentes/contabilidad/ifinan/ifinan/ifinan.component';
import { PersonalComponent } from './componentes/rrhh/personal/personal.component';
import { AddPersonalComponent } from './componentes/rrhh/personal/add-personal/add-personal.component';
import { ThActionsComponent } from './componentes/rrhh/th-actions/th-actions.component';
import { ThLeaveComponent } from './componentes/rrhh/th-leave/th-leave.component';
import { ThFilesComponent } from './componentes/rrhh/th-files/th-files.component';
import { ThAuditComponent } from './componentes/rrhh/th-audit/th-audit.component';
import { ThDashboardComponent } from './componentes/rrhh/th-dashboard/th-dashboard.component';
import { ThVacanciesComponent } from './componentes/rrhh/th-vacancies/th-vacancies.component';
import { ThCandidatesComponent } from './componentes/rrhh/th-candidates/th-candidates.component';
import { ThInterviewsComponent } from './componentes/rrhh/th-interviews/th-interviews.component';
import { ThOnboardingComponent } from './componentes/rrhh/th-onboarding/th-onboarding.component';
import { ThTrainingComponent } from './componentes/rrhh/th-training/th-training.component';
import { ThPerformanceComponent } from './componentes/rrhh/th-performance/th-performance.component';
import { ThCareerComponent } from './componentes/rrhh/th-career/th-career.component';
import { ThMentoringComponent } from './componentes/rrhh/th-mentoring/th-mentoring.component';
import { ThPayrollComponent } from './componentes/rrhh/th-payroll/th-payroll.component';
import { ThBenefitsComponent } from './componentes/rrhh/th-benefits/th-benefits.component';
import { ThIncentivesComponent } from './componentes/rrhh/th-incentives/th-incentives.component';
import { ThClimateComponent } from './componentes/rrhh/th-climate/th-climate.component';
import { ThWellbeingComponent } from './componentes/rrhh/th-wellbeing/th-wellbeing.component';
import { ThConflictsComponent } from './componentes/rrhh/th-conflicts/th-conflicts.component';
import { RemisionComponent } from './componentes/coactivas/remision/remision.component';
import { AddRemisionComponent } from './componentes/coactivas/remision/add-remision/add-remision.component';
import { DetallePlanillaComponent } from './componentes/facturas/detalle-planilla/detalle-planilla.component';
import { NtacreditoComponent } from './componentes/ntacredito/ntacredito.component';
import { AddNtacreditoComponent } from './componentes/ntacredito/add-ntacredito/add-ntacredito.component';
import { DefinirComponent } from './features/admin-central/pages/administracion/definir/definir.component';
import { HomeComponent } from './features/admin-central/pages/administracion/home/home.component';
import { StatusConveniosComponent } from './componentes/convenios/status-convenios/status-convenios.component';
import { CvClientesComponent } from './componentes/coactivas/carteras-vencidas/cv-clientes/cv-clientes.component';
import { AnularConvenioComponent } from './componentes/convenios/anular-convenio/anular-convenio.component';
import { AuthGuard } from './servicios/administracion/auth-guard';
import { CliDuplicadosComponent } from './componentes/clientes/cli-duplicados/cli-duplicados.component';
import { RutaToLectorComponent } from './componentes/rutas/ruta-to-lector/ruta-to-lector.component';
import { RecargosxcuentaComponent } from './componentes/facturacion/recargosxcuenta/recargosxcuenta.component';
import { SriEmitidosImportComponent } from './componentes/facelectro/sri-emitidos-import/sri-emitidos-import.component';
import { ReFacturacionesComponent } from './componentes/facturas/re-facturaciones/re-facturaciones.component';
import { ReportesjrComponent } from '@features/admin-central/pages/administracion/reportesjr/reportejr/reportejr.component';
import { AddReportejrComponent } from '@features/admin-central/pages/administracion/reportesjr/add-reportejr/add-reportejr.component';
import { ModiReportejrComponent } from '@features/admin-central/pages/administracion/reportesjr/modi-reportejr/modi-reportejr.component';
import { ImpReportejrComponent } from '@features/admin-central/pages/administracion/reportesjr/imp-reportejr/imp-reportejr.component';

const routes: Routes = [
  //Consumo de Agua
  { path: 'clientes', component: ClientesComponent, canActivate: [AuthGuard] },
  {
    path: 'add-cliente',
    component: AddClienteComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'modificar-clientes',
    component: ModificarClientesComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'detalles-cliente',
    component: DetallesClienteComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'buscar-cliente',
    component: BuscarClienteComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'imp-clientes/:page',
    component: ImpClienteComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'imp-infocliente',
    component: ImpInfoclienteComponent,
    canActivate: [AuthGuard],
  },
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },
  {
    path: 'clientesDuplicados',
    component: CliDuplicadosComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'abonados',
    component: ListarAbonadosComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'add-abonado',
    component: AddAbonadosComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'modificar-abonado',
    component: ModificarAbonadosComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'detalles-abonado',
    component: DetallesAbonadoComponent,
    canActivate: [AuthGuard],
  },

  { path: 'lecturas', component: LecturasComponent, canActivate: [AuthGuard] },
  {
    path: 'impor-lecturas',
    component: ImporLecturasComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'imp-lecturas',
    component: ImpLecturasComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'suspensiones',
    component: SuspensionesComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'add-suspension',
    component: AddSuspensionesComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'info-suspension',
    component: DetallesSuspensionesComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'habilitaciones',
    component: HabilitacionesComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'mora-abonados/:idruta',
    component: RutasmorasComponent,
    canActivate: [AuthGuard],
  },
  { path: 'pliego', component: PreciosxcatComponent, canActivate: [AuthGuard] },
  {
    path: 'modificar-preciosxcat',
    component: ModificarPreciosxcatComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'add-preciosxcat',
    component: AddPreciosxcatComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'info-preciosxcat',
    component: InfoPreciosxcatComponent,
    canActivate: [AuthGuard],
  },
  { path: 'pliego24', component: Pliego24Component, canActivate: [AuthGuard] },
  {
    path: 'simulacion',
    component: SimulacionComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'simulador_v2.0',
    component: SimuladordosComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'simulador_v3.0',
    component: SimuladortresComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'proyeccion',
    component: ProyeccionComponent,
    canActivate: [AuthGuard],
  },

  //========== FACTURACIÓN ===================
  {
    path: 'facelectro',
    component: FacelectroComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'generadorxml',
    component: GeneradorxmlComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'fecfactura',
    component: FecfacturaComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'anulaciones-bajas',
    component: AnulacionesBajasComponent,
    canActivate: [AuthGuard],
  },
  //Facturacion
  {
    path: 'facturacion',
    component: FacturacionComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'info-facturacion',
    component: InfoFacturacionComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'add-facturacion',
    component: AddFacturacionComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'recal-factura',
    component: RecalFacturaComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'recargosxcuenta',
    component: RecargosxcuentaComponent,
    canActivate: [AuthGuard],
  },
  //Planillas (Tabla facturas)
  { path: 'facturas', component: FacturasComponent, canActivate: [AuthGuard] },
  {
    path: 'info-planilla',
    component: InfoFacturasComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 're-facturacion',
    component: ReFacturacionesComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'detalle-planilla',
    component: DetallePlanillaComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'sri-txt',
    component: SriEmitidosImportComponent,
    canActivate: [AuthGuard],
  },
  //Productos (Tabla catalogoitems)
  {
    path: 'catalogoitems',
    component: CatalogoitemsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'info-catalogoitems',
    component: InfoCatalogoitemsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'add-catalogoitems',
    component: AddCatalogoitemsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'modi-catalogoitems',
    component: ModiCatalogoitemsComponent,
    canActivate: [AuthGuard],
  },
  //Usos de de los Productos (Tabla usoitems)
  { path: 'usoitems', component: UsoitemsComponent, canActivate: [AuthGuard] },
  {
    path: 'info-usoitems',
    component: InfoUsoitemsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'add-usoitems',
    component: AddUsoitemsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'modi-usoitems',
    component: ModiUsoitemsComponent,
    canActivate: [AuthGuard],
  },
  //Rubros de las Planillas
  { path: 'rubros', component: RubrosComponent, canActivate: [AuthGuard] },
  {
    path: 'info-rubro',
    component: InfoRubroComponent,
    canActivate: [AuthGuard],
  },
  { path: 'add-rubro', component: AddRubroComponent, canActivate: [AuthGuard] },
  {
    path: 'modi-rubro',
    component: ModiRubroComponent,
    canActivate: [AuthGuard],
  },

  //============ TRAMITES ======================
  {
    path: 'aguatramite',
    component: AguatramiteComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'info-aguatramite/:id',
    component: InfoAguatramiteComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'forms-aguatramite/:id',
    component: AguatramComponent,
    canActivate: [AuthGuard],
  },

  // forms-aguatramite/1

  { path: 'ctramites', component: TramitesComponent, canActivate: [AuthGuard] },
  {
    path: 'add-tramite',
    component: AddTramiteComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'info-tramite',
    component: InfoTramiteComponent,
    canActivate: [AuthGuard],
  },

  {
    path: 'tramites1',
    component: Tramites1Component,
    canActivate: [AuthGuard],
  },
  {
    path: 'add-tramites1',
    component: AddTramites1Component,
    canActivate: [AuthGuard],
  },

  //Certificaciones
  {
    path: 'ccertificaciones',
    component: ListarCertificacionesComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'modi-certificacion',
    component: ModificarCertificacionesComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'add-certificacion',
    component: AddCertificacionesComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'gene-certificacion/:idcertificacion',
    component: GeneCertificacionComponent,
  },
  { path: 'certitmp', component: CertitmpComponent, canActivate: [AuthGuard] },

  //Recaudación
  {
    path: 'recaudaciones',
    component: RecaudacionComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'recaudacion',
    component: AddRecaudaComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'convenios',
    component: ConveniosComponent,
    canActivate: [AuthGuard],
  },
  { path: 'cajas', component: ListarCajaComponent, canActivate: [AuthGuard] },
  {
    path: 'modicaja/:idcaja',
    component: ModificarCajaComponent,
    canActivate: [AuthGuard],
  },
  { path: 'add-caja', component: AddCajaComponent, canActivate: [AuthGuard] },
  { path: 'info-caja', component: InfoCajaComponent, canActivate: [AuthGuard] },
  { path: 'imp-caja', component: ImpCajasComponent, canActivate: [AuthGuard] },
  {
    path: 'imp-inf-caja',
    component: ImpInfoCajasComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'transferencias',
    component: TransferenciasComponent,
    canActivate: [AuthGuard],
  },

  {
    path: 'add-convenio',
    component: AddConvenioComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'modi-convenio',
    component: ModiConvenioComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'info-convenio',
    component: InfoConvenioComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'estados-convenios',
    component: StatusConveniosComponent,
    canActivate: [AuthGuard],
  },
  { path: 'anular-convenio/:idconvenio', component: AnularConvenioComponent },
  //{ path: 'imp-convenios', component: ImpConveniosComponent, canActivate: [AuthGuard]},
  // Intereses
  {
    path: 'intereses',
    component: ListarInteresesComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'modificar-intereses',
    component: ModificarInteresesComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'add-intereses',
    component: AddInteresesComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'impor-intereses',
    component: ImporInteresesComponent,
    canActivate: [AuthGuard],
  },
  // Pto. Emisión
  {
    path: 'ptoemision',
    component: ListarPtoemisionComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'modificar-ptoemision',
    component: ModificarPtoemisionComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'add-ptoemision',
    component: AddPtoemisionComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'info-establecimiento',
    component: InfoEstablecimientoComponent,
    canActivate: [AuthGuard],
  },
  //Categorías
  {
    path: 'categorias',
    component: ListarCategoriaComponent,
    canActivate: [AuthGuard],
  },
  // {path:'listar-categoria',component:ListarCategoriaComponent},
  {
    path: 'modificar-categoria',
    component: ModificarCategoriaComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'add-categoria',
    component: AddCategoriaComponent,
    canActivate: [AuthGuard],
  },

  { path: 'inicio', component: ContentWrapperComponent },

  //Rutas
  { path: 'rutas', component: RutasComponent, canActivate: [AuthGuard] },
  { path: 'add-rutas', component: AddRutasComponent, canActivate: [AuthGuard] },
  { path: 'info-ruta', component: InfoRutaComponent, canActivate: [AuthGuard] },
  {
    path: 'add-ruta-lector',
    component: RutaToLectorComponent,
    canActivate: [AuthGuard],
  },
  //Emisiones
  {
    path: 'emisiones',
    component: EmisionesComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'add-emision',
    component: AddEmisionComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'modiemision/:idemision',
    component: ModiEmisionComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'gene-emision',
    component: GeneEmisionComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'imp-emisiones',
    component: ImpEmisionesComponent,
    canActivate: [AuthGuard],
  },

  //{ path: 'emiactual/:idemision', component: EmiactualComponent, canActivate: [AuthGuard]},
  {
    path: 'emiactual',
    component: EmiactualComponent,
    canActivate: [AuthGuard],
  },
  //{ path: 'rutasxemision/:idemision/:emision', component: RutasxemisionComponent, canActivate: [AuthGuard]},
  //{ path: 'rutasxemision/:idemision', component: RutasxemisionComponent, canActivate: [AuthGuard]},
  {
    path: 'rutasxemision',
    component: RutasxemisionComponent,
    canActivate: [AuthGuard],
  },

  //Reclamos
  {
    path: 'reclamos',
    component: ListarReclamosComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'add-reclamo',
    component: AddReclamosComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'modificar-reclamo',
    component: ModificarReclamosComponent,
    canActivate: [AuthGuard],
  },
  // ================== CATALOGO =================
  /*Estado de los medidores*/
  {
    path: 'estadom',
    component: ListarEstadomComponent,
    canActivate: [AuthGuard],
  },
  /* Nacionalidades */
  {
    path: 'nacionalidades',
    component: ListarNacionalidadComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'add-nacionalidad',
    component: AddNacionalidadComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'modi-nacionalidad',
    component: ModificarNacionalidadComponent,
    canActivate: [AuthGuard],
  },
  /* Novedades */
  {
    path: 'novedades',
    component: ListarNovedadesComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'add-novedad',
    component: AddNovedadComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'novedades/:id',
    component: NovedadDetalleComponent,
    canActivate: [AuthGuard],
  },

  {
    path: 'tipopago',
    component: ListarTipopagoComponent,
    canActivate: [AuthGuard],
  },

  {
    path: 'tpidentificas',
    component: TpidentificasComponent,
    canActivate: [AuthGuard],
  },

  {
    path: 'tpreclamos',
    component: TpreclamosComponent,
    canActivate: [AuthGuard],
  },

  {
    path: 'ubicacionm',
    component: UbicacionmComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'add-ubicacionm',
    component: AddUbicacionmComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'modiubicacionm/:id',
    component: ModiUbicacionmComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'ntacredito',
    component: NtacreditoComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'add-ntacredito',
    component: AddNtacreditoComponent,
    canActivate: [AuthGuard],
  },
  //================ CONTABILIDAD =============================
  { path: 'cuentas', component: CuentasComponent, canActivate: [AuthGuard] },
  {
    path: 'add-cuenta',
    component: AddCuentaComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'modi-cuenta',
    component: ModiCuentaComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'info-cuenta',
    component: InfoCuentaComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'imp-cuentas',
    component: ImpCuentasComponent,
    canActivate: [AuthGuard],
  },
  { path: 'imp-mayor', component: ImpMayorComponent, canActivate: [AuthGuard] },

  { path: 'asientos', component: AsientosComponent, canActivate: [AuthGuard] },
  {
    path: 'add-asiento',
    component: AddAsientoComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'imp-asientos',
    component: ImpAsientosComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'modi-asiento',
    component: ModiAsientoComponent,
    canActivate: [AuthGuard],
  },

  { path: 'transaci', component: TransaciComponent, canActivate: [AuthGuard] },
  {
    path: 'add-transaci',
    component: AddTransaciComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'modi-transaci',
    component: ModiTransaciComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'imp-transaci',
    component: ImpTransaciComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'add-benextran',
    component: AddBenextranComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'add-liquiacfp',
    component: AddLiquiacfpComponent,
    canActivate: [AuthGuard],
  },

  { path: 'bancos', component: BancosComponent, canActivate: [AuthGuard] },
  {
    path: 'conciliaban',
    component: ConciliabanComponent,
    canActivate: [AuthGuard],
  }, //No se necesita: Ahora esta en el modal
  {
    path: 'imp-bancos',
    component: ImpBancosComponent,
    canActivate: [AuthGuard],
  },

  { path: 'sinafip', component: SinafipComponent, canActivate: [AuthGuard] },

  {
    path: 'niifcuentas',
    component: NiifcuentasComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'add-homologa',
    component: AddHomologaComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'add-niifcuenta',
    component: AddNiifcuentaComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'modi-niifcuenta',
    component: ModiNiifcuentaComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'imp-niifcuentas',
    component: ImpNiifcuentasComponent,
    canActivate: [AuthGuard],
  },

  {
    path: 'beneficiarios',
    component: BeneficiariosComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'add-beneficiario',
    component: AddBeneficiarioComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'info-beneficiario',
    component: InfoBeneficiarioComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'modi-beneficiario',
    component: ModiBeneficiarioComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'imp-beneficiarios',
    component: ImpBeneficiariosComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'imp-movibene',
    component: ImpMovibeneComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'info-liquida',
    component: InfoLiquidaComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'imp-liquida',
    component: ImpLiquidaComponent,
    canActivate: [AuthGuard],
  },

  { path: 'egresos', component: EgresosComponent, canActivate: [AuthGuard] },
  {
    path: 'modi-egreso',
    component: ModiEgresoComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'imp-egresos',
    component: ImpEgresosComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'add-egreso',
    component: AddEgresoComponent,
    canActivate: [AuthGuard],
  },

  {
    path: 'regrecauda',
    component: RegrecaudaComponent
  },

  {
    path: 'retenciones',
    component: RetencionesComponent
  },
  {
    path: 'imp-retenciones',
    component: ImpRetencionesComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'add-retencion',
    component: AddRetencionComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'modi-retencion',
    component: ModiRetencionComponent,
    canActivate: [AuthGuard],
  },

  {
    path: 'preingresos',
    component: PreingresosComponent,
    canActivate: [AuthGuard],
  },
  // { path: 'info-preingreso', component: InfoPreingresoComponent, canActivate: [AuthGuard]},
  {
    path: 'add-preingreso',
    component: AddPreingresoComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'modi-preingreso',
    component: ModiPreingresoComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'aux-ingreso',
    component: AuxIngresoComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'imp-preingreso',
    component: ImpPreingresoComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'imp-auxingreso',
    component: ImpAuxingresoComponent,
    canActivate: [AuthGuard],
  },

  {
    path: 'pregastos',
    component: PregastosComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'add-pregasto',
    component: AddPregastoComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'modi-pregasto',
    component: ModiPregastoComponent,
    canActivate: [AuthGuard],
  },
  { path: 'aux-gasto', component: AuxGastoComponent, canActivate: [AuthGuard] },
  {
    path: 'imp-pregasto',
    component: ImpPregastoComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'imp-auxgasto',
    component: ImpAuxgastoComponent,
    canActivate: [AuthGuard],
  },

  {
    path: 'certipresu',
    component: CertipresuComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'modi-certipresu',
    component: ModiCertipresuComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'add-certipresu',
    component: AddCertipresuComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'partixcerti',
    component: PartixcertiComponent,
    canActivate: [AuthGuard],
  },

  {
    path: 'tramipresu',
    component: TramipresuComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'add-tramipresu',
    component: AddTramipresuComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'modi-tramipresu',
    component: ModiTramipresuComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'prmisoxtrami',
    component: PrmisoxtramiComponent,
    canActivate: [AuthGuard],
  },

  { path: 'reformas', component: ReformasComponent, canActivate: [AuthGuard] },
  {
    path: 'add-reforma',
    component: AddReformaComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'modi-reforma',
    component: ModiReformaComponent,
    canActivate: [AuthGuard],
  },

  {
    path: 'clasificador',
    component: ClasificadorComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'info-clasificador',
    component: InfoClasificadorComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'modi-clasificador',
    component: ModiClasificadorComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'add-clasificador',
    component: AddClasificadorComponent,
    canActivate: [AuthGuard],
  },

  {
    path: 'ejecucion',
    component: EjecucionComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'modi-ejecucion',
    component: ModiEjecucionComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'add-ejecucion',
    component: AddEjecucionComponent,
    canActivate: [AuthGuard],
  },

  { path: 'bancos', component: BancosComponent, canActivate: [AuthGuard] },
  {
    path: 'conciliaban',
    component: ConciliabanComponent,
    canActivate: [AuthGuard],
  },

  {
    path: 'comprobacion',
    component: ComprobacionComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'estsituacion',
    component: EstFinancieraComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'estresultados',
    component: EstResultadosComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'flujoefectivo',
    component: EstFlujoEfeComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'ejecupresup',
    component: EstEjecucionPreComponent,
    canActivate: [AuthGuard],
  },

  {
    path: 'unicostos',
    component: UnicostosComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'cuecostos',
    component: CuecostosComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'comparativo',
    component: ComparativoComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'resulcostos',
    component: ResulcostosComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'imp-unicostos',
    component: ImpUnicostosComponent,
    canActivate: [AuthGuard],
  },

  { path: 'estrfunc', component: EstrfuncComponent, canActivate: [AuthGuard] },
  {
    path: 'info-estrfunc',
    component: InfoEstrfuncComponent,
    canActivate: [AuthGuard],
  },

  { path: 'ifinan', component: IfinanComponent, canActivate: [AuthGuard] },

  //================ RRHH =============================
  { path: 'personal', component: PersonalComponent, canActivate: [AuthGuard] },
  { path: 'th-actions', component: ThActionsComponent, canActivate: [AuthGuard] },
  { path: 'th-leave', component: ThLeaveComponent, canActivate: [AuthGuard] },
  { path: 'th-files', component: ThFilesComponent, canActivate: [AuthGuard] },
  { path: 'th-audit', component: ThAuditComponent, canActivate: [AuthGuard] },
  { path: 'th-dashboard', component: ThDashboardComponent, canActivate: [AuthGuard] },
  { path: 'th-vacancies', component: ThVacanciesComponent, canActivate: [AuthGuard] },
  { path: 'th-candidates', component: ThCandidatesComponent, canActivate: [AuthGuard] },
  { path: 'th-interviews', component: ThInterviewsComponent, canActivate: [AuthGuard] },
  { path: 'th-onboarding', component: ThOnboardingComponent, canActivate: [AuthGuard] },
  { path: 'th-training', component: ThTrainingComponent, canActivate: [AuthGuard] },
  { path: 'th-performance', component: ThPerformanceComponent, canActivate: [AuthGuard] },
  { path: 'th-career', component: ThCareerComponent, canActivate: [AuthGuard] },
  { path: 'th-mentoring', component: ThMentoringComponent, canActivate: [AuthGuard] },
  { path: 'th-payroll', component: ThPayrollComponent, canActivate: [AuthGuard] },
  { path: 'th-benefits', component: ThBenefitsComponent, canActivate: [AuthGuard] },
  { path: 'th-incentives', component: ThIncentivesComponent, canActivate: [AuthGuard] },
  { path: 'th-climate', component: ThClimateComponent, canActivate: [AuthGuard] },
  { path: 'th-wellbeing', component: ThWellbeingComponent, canActivate: [AuthGuard] },
  { path: 'th-conflicts', component: ThConflictsComponent, canActivate: [AuthGuard] },

  {
    path: 'add-personal',
    component: AddPersonalComponent,
    canActivate: [AuthGuard],
  },

  // ============== ADMINISTRACION CENTRAL ===================
  { path: 'tabla4', component: Tabla4Component, canActivate: [AuthGuard] },
  {
    path: 'add-tabla4',
    component: AddTabla4Component,
    canActivate: [AuthGuard],
  },
  {
    path: 'info-tabla4',
    component: InfoTabla4Component,
    canActivate: [AuthGuard],
  },
  {
    path: 'modi-tabla4',
    component: ModiTabla4Component,
    canActivate: [AuthGuard],
  },

  {
    path: 'documentos',
    component: DocumentosComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'add-documento',
    component: AddDocumentoComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'info-documento',
    component: InfoDocumentoComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'modi-documento',
    component: ModiDocumentoComponent,
    canActivate: [AuthGuard],
  },

  { path: 'usuarios', component: UsuariosComponent, canActivate: [AuthGuard] },
  {
    path: 'modi-usuario',
    component: ModiUsuarioComponent,
    canActivate: [AuthGuard],
  },

  { path: 'colores', component: ColoresComponent, canActivate: [AuthGuard] },
  {
    path: 'perfil-usuario',
    component: PerfilUsuarioComponent,
    canActivate: [AuthGuard],
  },
  { path: 'definir', component: DefinirComponent, canActivate: [AuthGuard] },
  { path: 'reportesjr', component: ReportesjrComponent, canActivate: [AuthGuard] },
  { path: 'add-reportejr', component: AddReportejrComponent, canActivate: [AuthGuard] },
  { path: 'modi-reportejr', component: ModiReportejrComponent, canActivate: [AuthGuard] },
  { path: 'imp-reportejr', component: ImpReportejrComponent, canActivate: [AuthGuard] },
  {
    path: 'admin/swagger-microservicios',
    loadComponent: () => import('./features/settings/swagger-hub/swagger-hub').then(m => m.SwaggerHubComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'admin/access-control',
    loadComponent: () => import('./features/settings/access-admin/access-admin').then(m => m.AccessAdminComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'admin/correos',
    loadComponent: () => import('./features/admin-central/pages/administracion/correos/email-admin.component').then(m => m.EmailAdminComponent),
    canActivate: [AuthGuard],
  },

  /* COACTIVAS */
  { path: 'cv-rubros', component: CvRubrosComponent, canActivate: [AuthGuard] },
  {
    path: 'cv-facturas',
    component: CvFacturasComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'cv-clientes',
    component: CvClientesComponent,
    canActivate: [AuthGuard],
  },
  { path: 'remision', component: RemisionComponent, canActivate: [AuthGuard] },
  {
    path: 'add-remision',
    component: AddRemisionComponent,
    canActivate: [AuthGuard],
  },

  // { path: 'login', component: LoginComponent, canActivate: [AuthGuard]},

  // ================== GESTIÓN DOCUMENTAL ==================
  { path: 'gd/documentos', loadComponent: () => import('./features/documentos/documentos-list/documentos-list').then(m => m.DocumentosListComponent), canActivate: [AuthGuard] },
  { path: 'gd/documentos/nuevo', loadComponent: () => import('./features/documentos/documento-form/documento-form').then(m => m.DocumentoFormComponent), canActivate: [AuthGuard] },
  { path: 'gd/documentos/:id', loadComponent: () => import('./features/documentos/documento-detalle/documento-detalle').then(m => m.DocumentoDetalleComponent), canActivate: [AuthGuard] },
  { path: 'gd/documentos/:id/editar', loadComponent: () => import('./features/documentos/documento-form/documento-form').then(m => m.DocumentoFormComponent), canActivate: [AuthGuard] },

  { path: 'gd/inbox', loadComponent: () => import('./features/documentos/inbox/inbox').then(m => m.InboxComponent), canActivate: [AuthGuard] },
  { path: 'gd/alerts', loadComponent: () => import('./features/documentos/alerts/alerts').then(m => m.AlertsComponent), canActivate: [AuthGuard] },
  { path: 'gd/dashboard', loadComponent: () => import('./features/documentos/dashboard/dashboard').then(m => m.DashboardEjecutivoComponent), canActivate: [AuthGuard] },
  { path: 'gd/case-files', loadComponent: () => import('./features/case-files/case-files-list').then(m => m.CaseFilesListComponent), canActivate: [AuthGuard] },
  { path: 'gd/settings/system', loadComponent: () => import('./features/settings/system/system-settings').then(m => m.SystemSettingsComponent), canActivate: [AuthGuard] },
  { path: 'gd/settings/ccd', loadComponent: () => import('./features/settings/ccd/ccd-settings').then(m => m.CcdSettingsComponent), canActivate: [AuthGuard] },
  { path: 'gd/settings/trd', loadComponent: () => import('./features/settings/trd/trd-settings').then(m => m.TrdSettingsComponent), canActivate: [AuthGuard] },
  { path: 'gd/settings/entities', redirectTo: 'tthh/entidades', pathMatch: 'full' },
  { path: 'gd/settings/document-types', loadComponent: () => import('./features/settings/document-types/document-types-list/document-types-list').then(m => m.DocumentTypesListComponent), canActivate: [AuthGuard] },
  { path: 'gd/settings/dependencies', redirectTo: 'tthh/dependencias', pathMatch: 'full' },
  { path: 'gd/settings/usuarios', redirectTo: 'tthh/dependencias', pathMatch: 'full' },
  { path: 'gd/my-profile', loadComponent: () => import('./features/documentos/my-profile/my-profile').then(m => m.GdMyProfileComponent), canActivate: [AuthGuard] },

  { path: 'tthh/entidades', loadComponent: () => import('./features/settings/entities/entities-list/entities-list').then(m => m.EntitiesListComponent), canActivate: [AuthGuard] },
  { path: 'tthh/dependencias', loadComponent: () => import('./features/settings/dependencies/dependencies-list/dependencies-list').then(m => m.DependenciesListComponent), canActivate: [AuthGuard] },
  { path: 'service-unavailable', loadComponent: () => import('./extras/service-unavailable/service-unavailable').then(m => m.ServiceUnavailableComponent) },

  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: '**', redirectTo: 'inicio' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }







