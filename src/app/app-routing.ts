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
import { InfoTramiteComponent } from './componentes/tramites/info-tramite/info-tramite.component';
import { AddAguatramiteComponent } from './componentes/aguatramite/add-aguatramite/add-aguatramite.component';

import { TramitesComponent } from './componentes/tramites/tramites/tramites.component';
import { AddTramiteComponent } from './componentes/tramites/add-tramite/add-tramite.component';

import { ListarCertificacionesComponent } from './componentes/certificaciones/listar-certificaciones/certificaciones.component';
import { ModificarCertificacionesComponent } from './componentes/certificaciones/modificar-certificaciones/modificar-certificaciones.component';
import { AddCertificacionesComponent } from './componentes/certificaciones/add-certificaciones/add-certificaciones.component';
import { GeneCertificacionComponent } from './componentes/certificaciones/gene-certificacion/gene-certificacion.component';
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
import { InfoPreingresoComponent } from './componentes/contabilidad/preingresos/info-preingreso/info-preingreso.component';
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
import { Tabla4Component } from './componentes/administracion/tabla4/tabla4/tabla4.component';
import { AddTabla4Component } from './componentes/administracion/tabla4/add-tabla4/add-tabla4.component';
import { InfoTabla4Component } from './componentes/administracion/tabla4/info-tabla4/info-tabla4.component';
import { ModiTabla4Component } from './componentes/administracion/tabla4/modi-tabla4/modi-tabla4.component';

// import { LoginComponent } from './compartida/login/login.component';

import { DocumentosComponent } from './componentes/administracion/documentos/documentos/documentos.component';
import { AddDocumentoComponent } from './componentes/administracion/documentos/add-documento/add-documento.component';
import { InfoDocumentoComponent } from './componentes/administracion/documentos/info-documento/info-documento.component';
import { ModiDocumentoComponent } from './componentes/administracion/documentos/modi-documento/modi-documento.component';

import { UsuariosComponent } from './componentes/administracion/usuarios/usuarios/usuarios.component';
import { ModiUsuarioComponent } from './componentes/administracion/usuarios/modi-usuario/modi-usuario.component';

import { ColoresComponent } from './componentes/administracion/colores/colores.component';
import { CertitmpComponent } from './componentes/certificaciones/certitmp/certitmp.component';
import { TransferenciasComponent } from './componentes/recaudacion/transferencias/transferencias.component';
import { PerfilUsuarioComponent } from './componentes/administracion/usuarios/perfil-usuario/perfil-usuario.component';
import { RecalFacturaComponent } from './componentes/facturas/recal-factura/recal-factura.component';
import { AddConvenioComponent } from './componentes/convenios/add-convenio/add-convenio.component';
import { GeneradorxmlComponent } from './componentes/facelectro/generadorxml/generadorxml.component';
import { ImpLecturasComponent } from './componentes/lecturas/imp-lecturas/imp-lecturas.component';
import { ImpCajasComponent } from './componentes/caja/imp-cajas/imp-cajas.component';

const routes: Routes = [
  //Consumo de Agua
  { path: 'clientes', component: ClientesComponent },
  { path: 'add-cliente', component: AddClienteComponent },
  { path: 'modificar-clientes', component: ModificarClientesComponent },
  { path: 'detalles-cliente', component: DetallesClienteComponent },
  { path: 'buscar-cliente', component: BuscarClienteComponent },

  { path: 'abonados', component: ListarAbonadosComponent },
  { path: 'add-abonado', component: AddAbonadosComponent },
  { path: 'modificar-abonado', component: ModificarAbonadosComponent },
  { path: 'detalles-abonado', component: DetallesAbonadoComponent },

  { path: 'lecturas', component: LecturasComponent },
  { path: 'impor-lecturas', component: ImporLecturasComponent },
  { path: 'imp-lecturas', component: ImpLecturasComponent },
  { path: 'suspensiones', component: SuspensionesComponent },
  { path: 'add-suspension', component: AddSuspensionesComponent },
  { path: 'info-suspension', component: DetallesSuspensionesComponent },
  { path: 'habilitaciones', component: HabilitacionesComponent },

  { path: 'pliego', component: PreciosxcatComponent },
  { path: 'modificar-preciosxcat', component: ModificarPreciosxcatComponent },
  { path: 'add-preciosxcat', component: AddPreciosxcatComponent },
  { path: 'info-preciosxcat', component: InfoPreciosxcatComponent },
  { path: 'pliego24', component: Pliego24Component },
  { path: 'simulacion', component: SimulacionComponent },
  { path: 'proyeccion', component: ProyeccionComponent },

  //========== FACTURACIÓN ===================
  { path: 'facelectro', component: FacelectroComponent },
  { path: 'generadorxml', component: GeneradorxmlComponent },
  //Facturacion
  { path: 'facturacion', component: FacturacionComponent },
  { path: 'info-facturacion', component: InfoFacturacionComponent },
  { path: 'add-facturacion', component: AddFacturacionComponent },
  { path: 'recal-factura', component: RecalFacturaComponent },
  //Planillas (Tabla facturas)
  { path: 'facturas', component: FacturasComponent },
  { path: 'info-planilla', component: InfoFacturasComponent },
  //Productos (Tabla catalogoitems)
  { path: 'catalogoitems', component: CatalogoitemsComponent },
  { path: 'info-catalogoitems', component: InfoCatalogoitemsComponent },
  { path: 'add-catalogoitems', component: AddCatalogoitemsComponent },
  { path: 'modi-catalogoitems', component: ModiCatalogoitemsComponent },
  //Usos de de los Productos (Tabla usoitems)
  { path: 'usoitems', component: UsoitemsComponent },
  { path: 'info-usoitems', component: InfoUsoitemsComponent },
  { path: 'add-usoitems', component: AddUsoitemsComponent },
  { path: 'modi-usoitems', component: ModiUsoitemsComponent },
  //Rubros de las Planillas
  { path: 'rubros', component: RubrosComponent },
  { path: 'info-rubro', component: InfoRubroComponent },
  { path: 'add-rubro', component: AddRubroComponent },
  { path: 'modi-rubro', component: ModiRubroComponent },

  //============ TRAMITES ======================
  { path: 'aguatramite', component: AguatramiteComponent },
  { path: 'info-aguatramite/:id', component: InfoAguatramiteComponent },
  { path: 'forms-aguatramite/:id', component: AguatramComponent },

  // forms-aguatramite/1

  { path: 'tramites', component: TramitesComponent },
  { path: 'add-tramite', component: AddTramiteComponent },
  { path: 'info-tramite', component: InfoTramiteComponent },

  { path: 'tramites1', component: Tramites1Component },
  { path: 'add-tramites1', component: AddTramites1Component },

  //Certificaciones
  { path: 'certificaciones', component: ListarCertificacionesComponent },
  { path: 'modi-certificacion', component: ModificarCertificacionesComponent },
  { path: 'add-certificacion', component: AddCertificacionesComponent },
  {
    path: 'gene-certificacion/:idcertificacion',
    component: GeneCertificacionComponent,
  },
  { path: 'certitmp', component: CertitmpComponent },

  //Recaudación
  { path: 'recaudaciones', component: RecaudacionComponent },
  { path: 'recaudacion', component: AddRecaudaComponent },
  { path: 'convenios', component: ConveniosComponent },
  { path: 'cajas', component: ListarCajaComponent },
  { path: 'modicaja/:idcaja', component: ModificarCajaComponent },
  { path: 'add-caja', component: AddCajaComponent },
  { path: 'info-caja', component: InfoCajaComponent },
  { path: 'imp-caja', component: ImpCajasComponent },
  { path: 'transferencias', component: TransferenciasComponent },

  { path: 'add-convenio', component: AddConvenioComponent },
  { path: 'modi-convenio', component: ModiConvenioComponent },
  { path: 'info-convenio', component: InfoConvenioComponent },
  //{ path: 'imp-convenios', component: ImpConveniosComponent },
  // Intereses
  { path: 'intereses', component: ListarInteresesComponent },
  { path: 'modificar-intereses', component: ModificarInteresesComponent },
  { path: 'add-intereses', component: AddInteresesComponent },
  { path: 'impor-intereses', component: ImporInteresesComponent },
  // Pto. Emisión
  { path: 'ptoemision', component: ListarPtoemisionComponent },
  { path: 'modificar-ptoemision', component: ModificarPtoemisionComponent },
  { path: 'add-ptoemision', component: AddPtoemisionComponent },
  { path: 'info-establecimiento', component: InfoEstablecimientoComponent },
  //Categorías
  { path: 'categorias', component: ListarCategoriaComponent },
  // {path:'listar-categoria',component:ListarCategoriaComponent},
  { path: 'modificar-categoria', component: ModificarCategoriaComponent },
  { path: 'add-categoria', component: AddCategoriaComponent },

  { path: 'inicio', component: ContentWrapperComponent },

  //Rutas
  { path: 'rutas', component: RutasComponent },
  { path: 'add-rutas', component: AddRutasComponent },
  { path: 'info-ruta', component: InfoRutaComponent },
  //Emisiones
  { path: 'emisiones', component: EmisionesComponent },
  { path: 'add-emision', component: AddEmisionComponent },
  { path: 'modiemision/:idemision', component: ModiEmisionComponent },
  { path: 'gene-emision', component: GeneEmisionComponent },

  //{ path: 'emiactual/:idemision', component: EmiactualComponent },
  { path: 'emiactual', component: EmiactualComponent },
  //{ path: 'rutasxemision/:idemision/:emision', component: RutasxemisionComponent },
  //{ path: 'rutasxemision/:idemision', component: RutasxemisionComponent },
  { path: 'rutasxemision', component: RutasxemisionComponent },

  //Reclamos
  { path: 'reclamos', component: ListarReclamosComponent },
  { path: 'add-reclamo', component: AddReclamosComponent },
  { path: 'modificar-reclamo', component: ModificarReclamosComponent },
  // ================== CATALOGO =================
  /*Estado de los medidores*/
  { path: 'estadom', component: ListarEstadomComponent },
  /* Nacionalidades */
  { path: 'nacionalidades', component: ListarNacionalidadComponent },
  { path: 'add-nacionalidad', component: AddNacionalidadComponent },
  { path: 'modi-nacionalidad', component: ModificarNacionalidadComponent },
  /* Novedades */
  { path: 'novedades', component: ListarNovedadesComponent },
  { path: 'add-novedad', component: AddNovedadComponent },
  { path: 'novedades/:id', component: NovedadDetalleComponent },

  { path: 'tipopago', component: ListarTipopagoComponent },

  { path: 'tpidentificas', component: TpidentificasComponent },

  { path: 'tpreclamos', component: TpreclamosComponent },

  { path: 'ubicacionm', component: UbicacionmComponent },
  { path: 'add-ubicacionm', component: AddUbicacionmComponent },
  { path: 'modiubicacionm/:id', component: ModiUbicacionmComponent },

  //================ CONTABILIDAD =============================
  { path: 'cuentas', component: CuentasComponent },
  { path: 'add-cuenta', component: AddCuentaComponent },

  { path: 'asientos', component: AsientosComponent },
  { path: 'add-asiento', component: AddAsientoComponent },

  { path: 'transaci', component: TransaciComponent },
  { path: 'add-transaci', component: AddTransaciComponent },
  { path: 'add-benextran', component: AddBenextranComponent },
  { path: 'add-liquiacfp', component: AddLiquiacfpComponent },

  { path: 'sinafip', component: SinafipComponent },

  { path: 'niifcuentas', component: NiifcuentasComponent },
  { path: 'add-homologa', component: AddHomologaComponent },
  { path: 'add-niifcuenta', component: AddNiifcuentaComponent },
  { path: 'modi-niifcuenta', component: ModiNiifcuentaComponent },

  { path: 'preingresos', component: PreingresosComponent },
  { path: 'info-preingreso', component: InfoPreingresoComponent },
  { path: 'add-preingreso', component: AddPreingresoComponent },
  { path: 'modi-preingreso', component: ModiPreingresoComponent },
  { path: 'aux-ingreso', component: AuxIngresoComponent },

  { path: 'pregastos', component: PregastosComponent },
  { path: 'add-pregasto', component: AddPregastoComponent },
  { path: 'modi-pregasto', component: ModiPregastoComponent },
  { path: 'aux-gasto', component: AuxGastoComponent },

  { path: 'certipresu', component: CertipresuComponent },
  { path: 'modi-certipresu', component: ModiCertipresuComponent },
  { path: 'add-certipresu', component: AddCertipresuComponent },
  { path: 'partixcerti', component: PartixcertiComponent },

  { path: 'tramipresu', component: TramipresuComponent },
  { path: 'add-tramipresu', component: AddTramipresuComponent },
  { path: 'modi-tramipresu/:idtrami', component: ModiTramipresuComponent },

  { path: 'reformas', component: ReformasComponent },
  { path: 'add-reforma', component: AddReformaComponent },
  { path: 'modi-reforma', component: ModiReformaComponent },

  { path: 'clasificador', component: ClasificadorComponent },
  { path: 'info-clasificador', component: InfoClasificadorComponent },
  { path: 'modi-clasificador', component: ModiClasificadorComponent },
  { path: 'add-clasificador', component: AddClasificadorComponent },

  { path: 'ejecucion', component: EjecucionComponent },
  { path: 'modi-ejecucion', component: ModiEjecucionComponent },
  { path: 'add-ejecucion', component: AddEjecucionComponent },

  { path: 'bancos', component: BancosComponent },
  { path: 'conciliaban', component: ConciliabanComponent },

  { path: 'estrfunc', component: EstrfuncComponent },
  { path: 'info-estrfunc', component: InfoEstrfuncComponent },

  // ============== ADMINISTRACION CENTRAL ===================
  { path: 'tabla4', component: Tabla4Component },
  { path: 'add-tabla4', component: AddTabla4Component },
  { path: 'info-tabla4', component: InfoTabla4Component },
  { path: 'modi-tabla4', component: ModiTabla4Component },

  { path: 'documentos', component: DocumentosComponent },
  { path: 'add-documento', component: AddDocumentoComponent },
  { path: 'info-documento', component: InfoDocumentoComponent },
  { path: 'modi-documento', component: ModiDocumentoComponent },

  { path: 'usuarios', component: UsuariosComponent },
  { path: 'modi-usuario', component: ModiUsuarioComponent },

  { path: 'colores', component: ColoresComponent },
  { path: 'perfil-usuario', component: PerfilUsuarioComponent },

  // { path: 'login', component: LoginComponent },

  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }
