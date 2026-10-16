import { Component, HostListener, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { PersonalService } from 'src/app/servicios/rrhh/personal.service';
import { ThFilesService } from 'src/app/servicios/rrhh/th-files.service';

@Component({ selector: 'app-th-files', templateUrl: './th-files.component.html', styleUrls: ['./th-files.component.css'] })
export class ThFilesComponent implements OnInit {
  idpersonal = 0;
  employee: any = {};
  files: any[] = [];
  msg = '';
  error = '';
  formError = '';
  loading = false;
  saving = false;
  downloading = 0;
  stateSaving = 0;
  permissionsReady = false;
  canWrite = false;
  formOpen = false;
  detail: any = null;
  selectedFile: File | null = null;
  mode: 'ARCHIVO' | 'REFERENCIA' = 'ARCHIVO';
  query = '';
  category = '';
  stateFilter = '';
  expiryFilter = '';
  page = 1;
  pageSize = 9;
  private sequence = 0;
  private lastFocus: HTMLElement | null = null;
  model = this.emptyModel();
  categories = [
    { value:'CONTRATO', label:'Contratos', icon:'bi-file-earmark-text' },
    { value:'CEDULA', label:'Identificación', icon:'bi-person-vcard' },
    { value:'TITULO', label:'Títulos académicos', icon:'bi-mortarboard' },
    { value:'CERTIFICADO', label:'Certificados', icon:'bi-patch-check' },
    { value:'HOJA_VIDA', label:'Hojas de vida', icon:'bi-person-lines-fill' },
    { value:'ACCION_PERSONAL', label:'Acciones de personal', icon:'bi-person-badge' },
    { value:'VACACIONES', label:'Vacaciones y permisos', icon:'bi-calendar2-week' },
    { value:'EVALUACION', label:'Evaluaciones', icon:'bi-clipboard-check' },
    { value:'CAPACITACION', label:'Capacitaciones', icon:'bi-journal-bookmark' },
    { value:'MEDICO', label:'Documentos médicos', icon:'bi-heart-pulse' },
    { value:'OTRO', label:'Otros documentos', icon:'bi-folder2' }
  ];
  constructor(private personalService: PersonalService, private filesService: ThFilesService,
    public authService: AutorizaService, private route: ActivatedRoute) {}

  private emptyModel() {
    return { tipo_doc:'CONTRATO', nombre_archivo:'', ruta_archivo:'', descripcion:'', numero_documento:'',
      emisor:'', fecha_emision:'', fecha_vencimiento:'', version_doc:1 };
  }

  ngOnInit(): void {
    sessionStorage.setItem('ventana','/th-files');
    const requested = this.route.snapshot.queryParamMap.get('idpersonal');
    const id = Number(requested);
    if (!requested || !Number.isSafeInteger(id) || id <= 0) {
      this.error = 'Abra el expediente digital desde la ficha del empleado.';
      return;
    }
    this.filesService.permissions().subscribe({
      next: p => {
        this.permissionsReady = true; this.canWrite = p.canWrite;
        this.personalService.getPersonalById(id).subscribe({
          next: (employee: any) => {
            if (!employee || Number(employee.idpersonal) !== id) {
              this.error = 'No se encontró el empleado solicitado. Abra su ficha para consultar el expediente.';
              return;
            }
            this.employee = employee;
            this.idpersonal = id;
            this.cargar();
          }, error: e => this.error = this.message(e,'No se pudo cargar el personal')
        });
      }, error: e => this.error = this.message(e,'No tiene acceso al expediente digital')
    });
  }

  get employeeName(): string { return [this.employee.apellidos,this.employee.nombres].filter(Boolean).join(' ') || 'Empleado'; }
  get initials(): string { return this.employeeName.split(/\s+/).filter(Boolean).slice(0,2).map(s => s[0]).join('').toUpperCase(); }
  get activeCount(): number { return this.files.filter(f => this.active(f) && this.expiry(f) !== 'VENCIDO').length; }
  get expiringCount(): number { return this.files.filter(f => this.active(f) && this.expiry(f) === 'POR_VENCER').length; }
  get archivedCount(): number { return this.files.filter(f => f.estado === 'ARCHIVADO').length; }
  active(f: any): boolean { return !f.estado || f.estado === 'ACTIVO'; }
  categoryName(value: string): string { return this.categories.find(c => c.value === value)?.label || value || 'Sin categoría'; }
  countCategory(value: string): number { return this.files.filter(f => f.tipo_doc === value).length; }
  expiry(f: any): string {
    if (!f.fecha_vencimiento) return 'SIN_FECHA';
    const end = new Date(f.fecha_vencimiento + 'T00:00:00');
    if (Number.isNaN(end.getTime())) return 'SIN_FECHA';
    const today = new Date(); today.setHours(0,0,0,0);
    const warning = new Date(today); warning.setDate(warning.getDate()+30);
    return end < today ? 'VENCIDO' : end <= warning ? 'POR_VENCER' : 'VIGENTE';
  }
  expiryLabel(f: any): string { return ({ VENCIDO:'Vencido', POR_VENCER:'Vence pronto', VIGENTE:'Vigente', SIN_FECHA:'Sin vencimiento' } as any)[this.expiry(f)]; }
  get filtered(): any[] {
    const q = this.query.trim().toLocaleLowerCase();
    return this.files.filter(f => (!this.category || f.tipo_doc === this.category)
      && (!this.stateFilter || (f.estado || 'ACTIVO') === this.stateFilter)
      && (!this.expiryFilter || this.expiry(f) === this.expiryFilter)
      && (!q || [f.nombre_archivo,f.numero_documento,f.emisor,f.descripcion].some(v => String(v || '').toLocaleLowerCase().includes(q))));
  }
  get totalPages(): number { return Math.max(1,Math.ceil(this.filtered.length/this.pageSize)); }
  get pageFiles(): any[] { const page = Math.min(this.page,this.totalPages); return this.filtered.slice((page-1)*this.pageSize,page*this.pageSize); }
  filterChanged(): void { this.page = 1; }
  clearFilters(): void { this.query=''; this.category=''; this.stateFilter=''; this.expiryFilter=''; this.page=1; }

  cargar(): void {
    const sequence = ++this.sequence; this.files=[]; this.detail=null;
    if (!this.idpersonal || !this.permissionsReady) { this.loading=false; return; }
    this.error=''; this.loading=true;
    this.filesService.byPersonal(this.idpersonal).pipe(finalize(() => { if (sequence === this.sequence) this.loading=false; }))
      .subscribe({ next:(data:any) => {
        if (sequence !== this.sequence) return;
        this.files=(Array.isArray(data) ? data : []).sort((a,b) => Number(b.idfile)-Number(a.idfile));
        this.page=Math.min(this.page,this.totalPages);
      }, error:e => { if (sequence === this.sequence) this.error=this.message(e,'No se pudo cargar el expediente'); } });
  }
  openForm(): void {
    if (!this.canWrite || !this.idpersonal || this.loading || this.saving) return;
    this.lastFocus=document.activeElement as HTMLElement;
    this.model=this.emptyModel(); this.selectedFile=null; this.mode='ARCHIVO'; this.formError=''; this.formOpen=true;
    setTimeout(() => document.getElementById('document-name')?.focus());
  }
  closeForm(): void { if (this.saving) return; this.formOpen=false; this.selectedFile=null; this.lastFocus?.focus(); }
  @HostListener('document:keydown.escape') escape(): void { this.closeForm(); this.detail=null; }
  @HostListener('document:keydown', ['$event']) trapFocus(event: KeyboardEvent): void {
    if (!this.formOpen || event.key !== 'Tab') return;
    const controls=Array.from(document.querySelectorAll<HTMLElement>('.document-dialog button:not([disabled]), .document-dialog input:not([disabled]), .document-dialog select:not([disabled]), .document-dialog textarea:not([disabled])'))
      .filter(el => el.offsetParent !== null);
    const first=controls[0], last=controls[controls.length-1];
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement===first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement===last) { event.preventDefault(); first.focus(); }
  }
  changeMode(): void { this.selectedFile=null; this.formError=''; this.model.ruta_archivo=''; }
  onFile(event: Event): void { const input=event.target as HTMLInputElement; this.selectFile(input.files?.[0] || null); input.value=''; }
  onDrop(event: DragEvent): void { event.preventDefault(); if (!this.saving && this.mode === 'ARCHIVO') this.selectFile(event.dataTransfer?.files?.[0] || null); }
  selectFile(file: File | null): void {
    this.formError='';
    if (!file) return;
    if (!/\.(pdf|jpe?g|png|docx|xlsx)$/i.test(file.name) || file.size===0 || file.size>10*1024*1024) {
      this.formError='Seleccione un PDF, JPG, PNG, DOCX o XLSX de hasta 10 MB.'; this.selectedFile=null; return;
    }
    this.selectedFile=file;
    if (!this.model.nombre_archivo.trim()) this.model.nombre_archivo=file.name.replace(/\.[^.]+$/,'').slice(0,255);
  }
  sizeLabel(size: number): string { return size >= 1024*1024 ? (size/1024/1024).toFixed(1)+' MB' : Math.max(1,Math.round(size/1024))+' KB'; }
  guardar(): void {
    if (!this.canWrite || this.saving || !this.idpersonal) return;
    this.formError=''; this.msg='';
    if (!this.model.nombre_archivo.trim() || this.model.nombre_archivo.length>255 || !this.model.tipo_doc
      || !Number.isInteger(this.model.version_doc) || this.model.version_doc<1 || this.model.version_doc>9999
      || this.model.numero_documento.length>120 || this.model.emisor.length>150 || this.model.descripcion.length>2000) {
      this.formError='Revise el nombre, la categoría, la versión y la longitud de los campos.'; return;
    }
    if (this.model.fecha_emision && this.model.fecha_vencimiento && this.model.fecha_vencimiento<this.model.fecha_emision) {
      this.formError='El vencimiento no puede ser anterior a la emisión.'; return;
    }
    if (this.mode==='ARCHIVO' && !this.selectedFile) { this.formError='Seleccione el archivo que desea adjuntar.'; return; }
    if (this.mode==='REFERENCIA' && !this.model.ruta_archivo.trim()) { this.formError='Indique la ruta o enlace del documento.'; return; }
    const payload={ ...this.model, fecha_emision:this.model.fecha_emision || null, fecha_vencimiento:this.model.fecha_vencimiento || null,
      idpersonal_personal:{idpersonal:this.idpersonal} };
    this.saving=true;
    const operation=this.mode==='ARCHIVO' ? this.filesService.upload(payload,this.selectedFile!) : this.filesService.save(payload);
    operation.pipe(finalize(() => this.saving=false)).subscribe({
      next:() => { this.formOpen=false; this.selectedFile=null; this.msg='Documento registrado en el expediente.'; this.lastFocus?.focus(); this.cargar(); },
      error:e => this.formError=this.message(e,'No se pudo registrar el documento. Sus datos se conservan para reintentar.')
    });
  }
  safeLink(f: any): string | null {
    if (f.origen==='ARCHIVO') return null;
    try { const url=new URL(f.ruta_archivo); return ['http:','https:'].includes(url.protocol) ? url.href : null; } catch { return null; }
  }
  descargar(f: any): void {
    if (this.downloading || f.origen!=='ARCHIVO') return;
    this.downloading=f.idfile;
    this.filesService.download(f.idfile).pipe(finalize(() => this.downloading=0)).subscribe({
      next:blob => { const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=f.nombre_original || f.nombre_archivo; a.click(); setTimeout(() => URL.revokeObjectURL(url),1000); },
      error:async e => {
        let message='No se pudo descargar el archivo.';
        if (e?.error instanceof Blob) { try { message=JSON.parse(await e.error.text()).message || message; } catch {} }
        else message=this.message(e,message);
        this.error=message;
      }
    });
  }
  cambiarEstado(f: any): void {
    if (!this.canWrite || this.stateSaving || this.saving) return;
    const estado=f.estado==='ARCHIVADO' ? 'ACTIVO' : 'ARCHIVADO';
    if (!confirm((estado==='ARCHIVADO' ? '¿Archivar' : '¿Restaurar')+' el documento "'+f.nombre_archivo+'"?')) return;
    this.stateSaving=f.idfile;
    this.filesService.changeState(f.idfile,estado).pipe(finalize(() => this.stateSaving=0)).subscribe({
      next:() => { this.msg=estado==='ARCHIVADO' ? 'Documento archivado; se conserva su archivo.' : 'Documento restaurado.'; this.cargar(); },
      error:e => this.error=this.message(e,'No se pudo cambiar el estado del documento')
    });
  }
  private message(e:any,fallback:string):string { return e?.error?.message || e?.error?.reason || fallback; }
}

