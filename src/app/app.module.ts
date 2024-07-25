import { RouterModule } from '@angular/router';

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Ng2SearchPipeModule } from 'ng2-search-filter';

import { AppComponent } from './app.component';
import { MainHeaderComponent } from './main-header/main-header.component';
import { MainSidebarComponent } from './main-sidebar/main-sidebar.component';
import { ContentWrapperComponent } from './content-wrapper/content-wrapper.component';
import { MainFooterComponent } from './main-footer/main-footer.component';

//Consumo de Agua
import { ClientesComponent } from './componentes/clientes/clientes/clientes.component';
import { AddClienteComponent } from './componentes/clientes/add-clientes/add-cliente.component';
import { ModificarClientesComponent } from './componentes/clientes/modificar-clientes/modificar-clientes.component';
import { DetallesClienteComponent } from './componentes/clientes/detalles-cliente/detalles-cliente.component';
import { SuspensionesComponent } from './componentes/suspensiones/suspensiones/suspensiones.component';
import { BuscarabonadoComponent } from './componentes/abonados/buscarabonado/buscarabonado.component';
import { AddSuspensionesComponent } from './componentes/suspensiones/add-suspensiones/add-suspensiones.component';
import { DetallesSuspensionesComponent } from './componentes/suspensiones/detalles-suspensiones/detalles-suspensiones.component';

import { RutasComponent } from './componentes/rutas/rutas/rutas.component';
import { AddRutasComponent } from './componentes/rutas/add-rutas/add-rutas.component';
import { EmisionesComponent } from './componentes/emisiones/emisiones/emisiones.component';
import { AddEmisionComponent } from './componentes/emisiones/add-emision/add-emision.component';
import { ModiEmisionComponent } from './componentes/emisiones/modi-emision/modi-emision.component';
import { RutasxemisionComponent } from './componentes/rutasxemision/rutasxemision/rutasxemision.component';
import { EmiactualComponent } from './componentes/rutasxemision/emiactual/emiactual.component';

//Facturacion
import { FacturacionComponent } from './componentes/facturacion/facturacion/facturacion.component';
import { InfoFacturacionComponent } from './componentes/facturacion/info-facturacion/info-facturacion.component';
import { RubrosComponent } from './componentes/rubros/rubros/rubros.component';

//Recaudacion
import { ConveniosComponent } from './componentes/convenios/convenios/convenios.component';
import { ModiConvenioComponent } from './componentes/convenios/modi-convenio/modi-convenio.component';
import { AddConvenioComponent } from './componentes/convenios/add-convenio/add-convenio.component';
import { ListarCajaComponent } from './componentes/caja/cajas/cajas.component';
import { AddCajaComponent } from './componentes/caja/add-caja/add-caja.component';
import { ModificarCajaComponent } from './componentes/caja/modificar-caja/modificar-caja.component';
import { TransferenciasComponent } from './componentes/recaudacion/transferencias/transferencias.component';

//Catálogos
import { ListarEstadomComponent } from './componentes/estadom/listar-estadom/listar-estadom.component';
import { AddEstadomComponent } from './componentes/estadom/add-estadom/add-estadom.component';
import { ListarNacionalidadComponent } from './componentes/nacionalidad/listar-nacionalidad/listar-nacionalidad.component';
import { AddNacionalidadComponent } from './componentes/nacionalidad/add-nacionalidad/add-nacionalidad.component';
import { ListarNovedadesComponent } from './componentes/novedad/listar-novedades/listar-novedades.component';
import { AddNovedadComponent } from './componentes/novedad/add-novedad/add-novedad.component';
import { NovedadDetalleComponent } from './componentes/novedad/novedad-detalle/novedad-detalle.component';
import { TpidentificasComponent } from './componentes/tpidentifica/tpidentificas/tpidentificas.component';
import { AddTpidentificaComponent } from './componentes/tpidentifica/add-tpidentifica/add-tpidentifica.component';
import { ListarTipopagoComponent } from './componentes/tipopago/listar-tipopago/listar-tipopago.component';
import { AddTipopagoComponent } from './componentes/tipopago/add-tipopago/add-tipopago.component';
import { TpreclamosComponent } from './componentes/tpreclamos/tpreclamos/tpreclamos.component';
import { AddTpreclamoComponent } from './componentes/tpreclamos/add-tpreclamo/add-tpreclamo.component';
import { C1Component } from './test/c1/c1.component';
import { C2Component } from './test/c2/c2.component';

import { ListarPtoemisionComponent } from './componentes/ptoemision/listar-ptoemision/listar-ptoemision.component';
import { AddPtoemisionComponent } from './componentes/ptoemision/add-ptoemision/add-ptoemision.component';
import { ModificarPtoemisionComponent } from './componentes/ptoemision/modificar-ptoemision/modificar-ptoemision.component';
import { ListarCategoriaComponent } from './componentes/categoria/categorias/categorias.component';
import { AddCategoriaComponent } from './componentes/categoria/add-categoria/add-categoria.component';
import { ModificarCategoriaComponent } from './componentes/categoria/modi-categoria/modi-categoria.component';
import { ModificarInteresesComponent } from './componentes/intereses/modificar-intereses/modificar-intereses.component';
import { AddInteresesComponent } from './componentes/intereses/add-intereses/add-intereses.component';
import { ListarInteresesComponent } from './componentes/intereses/intereses/intereses.component';
import { PreciosxcatComponent } from './componentes/preciosxcat/preciosxcat/preciosxcat.component';
import { AddPreciosxcatComponent } from './componentes/preciosxcat/add-preciosxcat/add-preciosxcat.component';
import { ModificarPreciosxcatComponent } from './componentes/preciosxcat/modificar-preciosxcat/modificar-preciosxcat.component';
import { ModulosComponent } from './componentes/modulos/modulos/modulos.component';
import { ListarAbonadosComponent } from './componentes/abonados/listar-abonados/listar-abonados.component';
import { AddAbonadosComponent } from './componentes/abonados/add-abonados/add-abonados.component';
import { ModificarAbonadosComponent } from './componentes/abonados/modificar-abonados/modificar-abonados.component';
import { DetallesAbonadoComponent } from './componentes/abonados/detalles-abonado/detalles-abonado.component';
import { ListarCertificacionesComponent } from './componentes/ccertificaciones/listar-certificaciones/certificaciones.component';
import { AddCertificacionesComponent } from './componentes/ccertificaciones/add-certificaciones/add-certificaciones.component';
import { ModificarCertificacionesComponent } from './componentes/ccertificaciones/modificar-certificaciones/modificar-certificaciones.component';
import { ListarReclamosComponent } from './componentes/reclamos/listar-reclamos/listar-reclamos.component';
import { AddReclamosComponent } from './componentes/reclamos/add-reclamos/add-reclamos.component';
import { ModificarReclamosComponent } from './componentes/reclamos/modificar-reclamos/modificar-reclamos.component';
import { UbicacionmComponent } from './componentes/ubicacionm/ubicacionm/ubicacionm.component';
import { ModiUbicacionmComponent } from './componentes/ubicacionm/modi-ubicacionm/modi-ubicacionm.component';
import { AddUbicacionmComponent } from './componentes/ubicacionm/add-ubicacionm/add-ubicacionm.component';
import { ModificarNacionalidadComponent } from './componentes/nacionalidad/modificar-nacionalidad/modificar-nacionalidad.component';
import { Tramites1Component } from './componentes/tramites1/tramites1/tramites1.component';
import { AddTramites1Component } from './componentes/tramites1/add-tramites1/add-tramites1.component';
import { ItemxfactComponent } from './componentes/facturacion/itemxfact/itemxfact.component';
import { AguatramiteComponent } from './componentes/aguatramite/aguatramite/aguatramite.component';
import { InfoAguatramiteComponent } from './componentes/aguatramite/info-aguatramite/info-aguatramite.component';
import { FacturasComponent } from './componentes/facturas/facturas/facturas.component';
import { InfoFacturasComponent } from './componentes/facturas/info-facturas/info-factura.component';
import { RubroxfacComponent } from './componentes/facturas/rubroxfac/rubroxfac.component';
import { FacelectroComponent } from './componentes/facelectro/facelectro/facelectro.component';
import { DetFacelectroComponent } from './componentes/facelectro/det-facelectro/det-facelectro.component';
import { InfoConvenioComponent } from './componentes/convenios/info-convenio/info-convenio.component';
import { InfoCajaComponent } from './componentes/caja/info-caja/info-caja.component';
import { InfoEstablecimientoComponent } from './componentes/ptoemision/info-establecimiento/info-establecimiento.component';
import { TramitesComponent } from './componentes/ctramites/tramites/tramites.component';
import { AddTramiteComponent } from './componentes/ctramites/add-tramite/add-tramite.component';
import { InfoTramiteComponent } from './componentes/ctramites/info-tramite/info-tramite.component';
import { InfoPreciosxcatComponent } from './componentes/preciosxcat/info-preciosxcat/info-preciosxcat.component';
import { RecaudacionComponent } from './componentes/recaudacion/recaudacion/recaudacion.component';
import { AddRecaudaComponent } from './componentes/recaudacion/add-recauda/add-recauda.component';
import { InfoRutaComponent } from './componentes/rutas/info-ruta/info-ruta.component';

// =========== Contabilidad =============
import { ClasificadorComponent } from './componentes/contabilidad/clasificador/clasificador/clasificador.component';
import { InfoClasificadorComponent } from './componentes/contabilidad/clasificador/info-clasificador/info-clasificador.component';
import { ModiClasificadorComponent } from './componentes/contabilidad/clasificador/modi-clasificador/modi-clasificador.component';
import { AddClasificadorComponent } from './componentes/contabilidad/clasificador/add-clasificador/add-clasificador.component';

import { ReformasComponent } from './componentes/contabilidad/reformas/reformas/reformas.component';
import { AddReformaComponent } from './componentes/contabilidad/reformas/add-reforma/add-reforma.component';

import { EjecucionComponent } from './componentes/contabilidad/ejecucion/ejecucion/ejecucion.component';

// =========== Administración Central ==================
import { Tabla4Component } from './componentes/administracion/tabla4/tabla4/tabla4.component';
import { AddTabla4Component } from './componentes/administracion/tabla4/add-tabla4/add-tabla4.component';
import { DocumentosComponent } from './componentes/administracion/documentos/documentos/documentos.component';
import { AddDocumentoComponent } from './componentes/administracion/documentos/add-documento/add-documento.component';
import { InfoDocumentoComponent } from './componentes/administracion/documentos/info-documento/info-documento.component';
import { ModiDocumentoComponent } from './componentes/administracion/documentos/modi-documento/modi-documento.component';
import { InfoTabla4Component } from './componentes/administracion/tabla4/info-tabla4/info-tabla4.component';
import { ModiTabla4Component } from './componentes/administracion/tabla4/modi-tabla4/modi-tabla4.component';
import { LoginComponent } from './compartida/login/login.component';

// ================ Pipes ==========================
import { NombreEmisionPipe } from './pipes/nombre-emision.pipe';
import { EstadoEmisionPipe } from './pipes/estado-emision.pipe';
import { InfoRubroComponent } from './componentes/rubros/info-rubro/info-rubro.component';
import { NoSiPipe } from './pipes/no-si.pipe';
import { NombreMesPipe } from './pipes/nombre-mes.pipe';
import { BloqueConsumoPipe } from './pipes/bloque-consumo.pipe';

import { UsoitemsComponent } from './componentes/usoitems/usoitems/usoitems.component';
import { InfoUsoitemsComponent } from './componentes/usoitems/info-usoitems/info-usoitems.component';
import { CatalogoitemsComponent } from './componentes/catalogoitems/catalogoitems/catalogoitems.component';
import { AddFacturacionComponent } from './componentes/facturacion/add-facturacion/add-facturacion.component';
import { InfoCatalogoitemsComponent } from './componentes/catalogoitems/info-catalogoitems/info-catalogoitems.component';
import { PreingresosComponent } from './componentes/contabilidad/preingresos/preingresos/preingresos.component';
import { InfoPreingresoComponent } from './componentes/contabilidad/preingresos/info-preingreso/info-preingreso.component';
import { ModiPreingresoComponent } from './componentes/contabilidad/preingresos/modi-preingreso/modi-preingreso.component';
import { AddPreingresoComponent } from './componentes/contabilidad/preingresos/add-preingreso/add-preingreso.component';
import { AddCatalogoitemsComponent } from './componentes/catalogoitems/add-catalogoitems/add-catalogoitems.component';
import { ModiCatalogoitemsComponent } from './componentes/catalogoitems/modi-catalogoitems/modi-catalogoitems.component';
import { AddRubroComponent } from './componentes/rubros/add-rubro/add-rubro.component';
import { AddUsoitemsComponent } from './componentes/usoitems/add-usoitems/add-usoitems.component';
import { ModiUsoitemsComponent } from './componentes/usoitems/modi-usoitems/modi-usoitems.component';
import { ModiRubroComponent } from './componentes/rubros/modi-rubro/modi-rubro.component';
import { CertipresuComponent } from './componentes/contabilidad/certipresu/certipresu/certipresu.component';
import { UsuariosComponent } from './componentes/administracion/usuarios/usuarios/usuarios.component';
import { ModiReformaComponent } from './componentes/contabilidad/reformas/modi-reforma/modi-reforma.component';
import { ModiEjecucionComponent } from './componentes/contabilidad/ejecucion/modi-ejecucion/modi-ejecucion.component';
import { AddEjecucionComponent } from './componentes/contabilidad/ejecucion/add-ejecucion/add-ejecucion.component';
import { ModiCertipresuComponent } from './componentes/contabilidad/certipresu/modi-certipresu/modi-certipresu.component';
import { AddCertipresuComponent } from './componentes/contabilidad/certipresu/add-certipresu/add-certipresu.component';
import { PartixcertiComponent } from './componentes/contabilidad/partixcerti/partixcerti/partixcerti.component';
import { ImporInteresesComponent } from './componentes/intereses/impor-intereses/impor-intereses.component';
import { GeneEmisionComponent } from './componentes/emisiones/gene-emision/gene-emision.component';
import { ImporLecturasComponent } from './componentes/lecturas/impor-lecturas/impor-lecturas.component';
import { BancosComponent } from './componentes/contabilidad/bancos/bancos/bancos.component';
import { ConciliabanComponent } from './componentes/contabilidad/bancos/conciliaban/conciliaban.component';
import { ColoresComponent } from './componentes/administracion/colores/colores.component';
import { Pliego24Component } from './componentes/pliego24/pliego24/pliego24.component';
import { ProyeccionComponent } from './componentes/pliego24/proyeccion/proyeccion.component';
import { AuxIngresoComponent } from './componentes/contabilidad/preingresos/aux-ingreso/aux-ingreso.component';
import { AsientosComponent } from './componentes/contabilidad/asientos/asientos/asientos.component';
import { PregastosComponent } from './componentes/contabilidad/pregastos/pregastos/pregastos.component';
import { AddPregastoComponent } from './componentes/contabilidad/pregastos/add-pregasto/add-pregasto.component';
import { EstrfuncComponent } from './componentes/contabilidad/estrfunc/estrfunc/estrfunc.component';
import { InfoEstrfuncComponent } from './componentes/contabilidad/estrfunc/info-estrfunc/info-estrfunc.component';
import { ModiPregastoComponent } from './componentes/contabilidad/pregastos/modi-pregasto/modi-pregasto.component';

import { NgxMaskModule } from 'ngx-mask';
import { AuxGastoComponent } from './componentes/contabilidad/pregastos/aux-gasto/aux-gasto.component';
import { NiifcuentasComponent } from './componentes/contabilidad/niifcuentas/niifcuentas/niifcuentas.component';
import { AddHomologaComponent } from './componentes/contabilidad/niifcuentas/add-homologa/add-homologa.component';
import { AddNiifcuentaComponent } from './componentes/contabilidad/niifcuentas/add-niifcuenta/add-niifcuenta.component';
import { ModiNiifcuentaComponent } from './componentes/contabilidad/niifcuentas/modi-niifcuenta/modi-niifcuenta.component';
import { TramipresuComponent } from './componentes/contabilidad/tramipresu/tramipresu/tramipresu.component';
import { AddTramipresuComponent } from './componentes/contabilidad/tramipresu/add-tramipresu/add-tramipresu.component';
import { ModiTramipresuComponent } from './componentes/contabilidad/tramipresu/modi-tramipresu/modi-tramipresu.component';
import { CuentasComponent } from './componentes/contabilidad/cuentas/cuentas/cuentas.component';
import { AddCuentaComponent } from './componentes/contabilidad/cuentas/add-cuenta/add-cuenta.component';
import { SinafipComponent } from './componentes/contabilidad/sinafip/sinafip/sinafip.component';
import { TransaciComponent } from './componentes/contabilidad/transaci/transaci/transaci.component';
import { AddTransaciComponent } from './componentes/contabilidad/transaci/add-transaci/add-transaci.component';
import { AddAsientoComponent } from './componentes/contabilidad/asientos/add-asiento/add-asiento.component';
import { AddBenextranComponent } from './componentes/contabilidad/transaci/add-benextran/add-benextran.component';
import { SimulacionComponent } from './componentes/pliego24/simulacion/simulacion.component';
import { AddLiquiacfpComponent } from './componentes/contabilidad/transaci/add-liquiacfp/add-liquiacfp.component';
import { ModificarTramitenuevoComponent } from './componentes/aguatramite/modificar-tramitenuevo/modificar-tramitenuevo.component';
import { AddAguatramiteComponent } from './componentes/aguatramite/add-aguatramite/add-aguatramite.component';
import { CertitmpComponent } from './componentes/ccertificaciones/certitmp/certitmp.component';
import { GeneCertificacionComponent } from './componentes/ccertificaciones/gene-certificacion/gene-certificacion.component';
import { AguatramComponent } from './componentes/aguatramite/aguatram/aguatram.component';
import { BuscarClienteComponent } from './componentes/clientes/buscar-cliente/buscar-cliente.component';
import { ModiUsuarioComponent } from './componentes/administracion/usuarios/modi-usuario/modi-usuario.component';
import { BuscarRutaComponent } from './componentes/suspensiones/buscar-ruta/buscar-ruta.component';
import { HabilitacionesComponent } from './componentes/habilitaciones/habilitaciones/habilitaciones.component';
import { AddHabilitacionComponent } from './componentes/habilitaciones/add-habilitacion/add-habilitacion.component';
import { HashLocationStrategy, LocationStrategy, PathLocationStrategy } from '@angular/common';
import { HistorialconsumoComponent } from './componentes/abonados/historialconsumo/historialconsumo.component';
import { PerfilUsuarioComponent } from './componentes/administracion/usuarios/perfil-usuario/perfil-usuario.component';
import { RecalFacturaComponent } from './componentes/facturas/recal-factura/recal-factura.component';
import { DefinirComponent } from './componentes/administracion/definir/definir.component';
import { GeneradorxmlComponent } from './componentes/facelectro/generadorxml/generadorxml.component';
import { ImpLecturasComponent } from './componentes/lecturas/imp-lecturas/imp-lecturas.component';
import { LecturasComponent } from './componentes/lecturas/lecturas.component';
import { ImpCajasComponent } from './componentes/caja/imp-cajas/imp-cajas.component';
import { ImpInfoCajasComponent } from './componentes/caja/info-caja/imp-info-cajas/imp-info-cajas.component';
import { AnulacionesBajasComponent } from './componentes/facturas/anulaciones-bajas/anulaciones-bajas.component';
import { FecfacturaComponent } from './componentes/facelectro/fecfactura/fecfactura.component';
import { RutasmorasComponent } from './componentes/suspensiones/rutasmoras/rutasmoras.component';
import { LoadingComponent } from './extras/loading/loading.component';
import { ImpClienteComponent } from './componentes/clientes/imp-cliente/imp-cliente.component';
import { ImpInfoclienteComponent } from './componentes/clientes/imp-infocliente/imp-infocliente.component';

// import { HashLocationStrategy, LocationStrategy } from '@angular/common';

@NgModule({
   declarations: [

      AppComponent, MainHeaderComponent, MainSidebarComponent, ContentWrapperComponent, MainFooterComponent,

      //Consumo de Agua
      ClientesComponent, AddClienteComponent, ModificarClientesComponent, DetallesClienteComponent,
      ListarAbonadosComponent, BuscarabonadoComponent,
      RutasComponent, AddRutasComponent, InfoRutaComponent,
      EmisionesComponent, AddEmisionComponent, ModiEmisionComponent,
      RutasxemisionComponent, EmiactualComponent,
      SuspensionesComponent, AddSuspensionesComponent, DetallesSuspensionesComponent,

      //Facturacion
      FacturacionComponent, InfoFacturacionComponent, RubrosComponent, InfoRubroComponent, RecalFacturaComponent,
      DefinirComponent, GeneradorxmlComponent, FecfacturaComponent,
      //Recaudación
      ListarCajaComponent, AddCajaComponent, ModificarCajaComponent,
      ConveniosComponent, ModiConvenioComponent, AddConvenioComponent, TransferenciasComponent,
      //Catálogos
      ListarEstadomComponent, AddEstadomComponent,
      ListarNacionalidadComponent, AddNacionalidadComponent, ModificarNacionalidadComponent,
      ListarNovedadesComponent, AddNovedadComponent, NovedadDetalleComponent,
      TpidentificasComponent, AddTpidentificaComponent,
      ListarTipopagoComponent, AddTipopagoComponent,
      TpreclamosComponent, AddTpreclamoComponent,
      ListarPtoemisionComponent, AddPtoemisionComponent, ModificarPtoemisionComponent, InfoEstablecimientoComponent,
      ListarCategoriaComponent, AddCategoriaComponent, ModificarCategoriaComponent,
      ListarInteresesComponent, ModificarInteresesComponent, AddInteresesComponent,
      PreciosxcatComponent, AddPreciosxcatComponent, ModificarPreciosxcatComponent,
      LecturasComponent, ModulosComponent,
      UbicacionmComponent, ModiUbicacionmComponent, AddUbicacionmComponent,

      C1Component, C2Component, AddAbonadosComponent,
      ModificarAbonadosComponent, DetallesAbonadoComponent,

      ListarCertificacionesComponent, AddCertificacionesComponent,
      ModificarCertificacionesComponent, ListarReclamosComponent,

      AddReclamosComponent, ModificarReclamosComponent, Tramites1Component,
      AddTramites1Component, ItemxfactComponent,
      AguatramiteComponent, InfoAguatramiteComponent,
      FacturasComponent, InfoFacturasComponent, RubroxfacComponent,
      FacelectroComponent, DetFacelectroComponent, InfoConvenioComponent, ImpCajasComponent, ImpInfoCajasComponent,
      InfoCajaComponent, TramitesComponent, AddTramiteComponent, InfoTramiteComponent,
      InfoPreciosxcatComponent, RecaudacionComponent, AddRecaudaComponent,
      UsoitemsComponent, InfoUsoitemsComponent,
      CatalogoitemsComponent, AddFacturacionComponent, InfoCatalogoitemsComponent, PreingresosComponent,
      InfoPreingresoComponent, ModiPreingresoComponent, AddPreingresoComponent, AddCatalogoitemsComponent,
      ModiCatalogoitemsComponent, AddRubroComponent, AddUsoitemsComponent, ModiUsoitemsComponent,
      ModiRubroComponent, CertipresuComponent,

      // ============ CONTABILIDAD ================
      ClasificadorComponent, InfoClasificadorComponent, ModiClasificadorComponent, AddClasificadorComponent,
      ReformasComponent, AddReformaComponent, EjecucionComponent,

      // ========== ADMINISTRACION CENTRAL ============
      Tabla4Component, AddTabla4Component, DocumentosComponent, AddDocumentoComponent, InfoDocumentoComponent, ModiDocumentoComponent,
      InfoTabla4Component, ModiTabla4Component, LoginComponent,
      UsuariosComponent, ModiReformaComponent,
      ModiEjecucionComponent, AddEjecucionComponent, ModiCertipresuComponent, AddCertipresuComponent,
      PartixcertiComponent, ImporInteresesComponent, GeneEmisionComponent, ImporLecturasComponent, ImpLecturasComponent,
      BancosComponent, ConciliabanComponent, ColoresComponent, Pliego24Component, PerfilUsuarioComponent,
      // ============ Pipes =============
      EstadoEmisionPipe, NombreEmisionPipe, NoSiPipe, NombreMesPipe, BloqueConsumoPipe, ProyeccionComponent,
      AuxIngresoComponent, AsientosComponent, PregastosComponent, AddPregastoComponent, EstrfuncComponent,
      InfoEstrfuncComponent, ModiPregastoComponent, AuxGastoComponent, NiifcuentasComponent, AddHomologaComponent,
      AddNiifcuentaComponent, ModiNiifcuentaComponent, TramipresuComponent, AddTramipresuComponent, ModiTramipresuComponent,
      CuentasComponent, AddCuentaComponent, SinafipComponent, TransaciComponent, AddTransaciComponent, AddAsientoComponent,
      AddBenextranComponent, SimulacionComponent, AddLiquiacfpComponent, ModificarTramitenuevoComponent, AddAguatramiteComponent, CertitmpComponent, GeneCertificacionComponent, AguatramComponent, BuscarClienteComponent, ModiUsuarioComponent, BuscarRutaComponent, HabilitacionesComponent, AddHabilitacionComponent, HistorialconsumoComponent, AnulacionesBajasComponent, RutasmorasComponent, LoadingComponent, ImpClienteComponent, ImpInfoclienteComponent,
   ],

   imports: [
      BrowserModule, AppRoutingModule, HttpClientModule, FormsModule, ReactiveFormsModule,
      HttpClientModule, Ng2SearchPipeModule, NgxMaskModule.forRoot()],

   providers: [MainFooterComponent,
      { provide: LocationStrategy, useClass: HashLocationStrategy }
      /* https://angular.io/api/common/HashLocationStrategy */
   ],


   bootstrap: [AppComponent]
})

export class AppModule { }
