package com.epmapat.erp_epmapat.DTO;

import java.math.BigDecimal;
import java.util.Date;

public class FacturacionCuotasPendientesDTO {

   private Long idfacturacion;
   private Date feccrea;
   private String cliente;
   private String descripcion;
   private BigDecimal valorFacturacion;
   private Long cuotas;
   private Long planillasGeneradas;
   private Long planillasPagadas;
   private Long planillasPendientes;
   private BigDecimal valorPlanillas;
   private BigDecimal valorPendiente;

   public FacturacionCuotasPendientesDTO() {
   }

   public Long getIdfacturacion() {
      return idfacturacion;
   }

   public void setIdfacturacion(Long idfacturacion) {
      this.idfacturacion = idfacturacion;
   }

   public Date getFeccrea() {
      return feccrea;
   }

   public void setFeccrea(Date feccrea) {
      this.feccrea = feccrea;
   }

   public String getCliente() {
      return cliente;
   }

   public void setCliente(String cliente) {
      this.cliente = cliente;
   }

   public String getDescripcion() {
      return descripcion;
   }

   public void setDescripcion(String descripcion) {
      this.descripcion = descripcion;
   }

   public BigDecimal getValorFacturacion() {
      return valorFacturacion;
   }

   public void setValorFacturacion(BigDecimal valorFacturacion) {
      this.valorFacturacion = valorFacturacion;
   }

   public Long getCuotas() {
      return cuotas;
   }

   public void setCuotas(Long cuotas) {
      this.cuotas = cuotas;
   }

   public Long getPlanillasGeneradas() {
      return planillasGeneradas;
   }

   public void setPlanillasGeneradas(Long planillasGeneradas) {
      this.planillasGeneradas = planillasGeneradas;
   }

   public Long getPlanillasPagadas() {
      return planillasPagadas;
   }

   public void setPlanillasPagadas(Long planillasPagadas) {
      this.planillasPagadas = planillasPagadas;
   }

   public Long getPlanillasPendientes() {
      return planillasPendientes;
   }

   public void setPlanillasPendientes(Long planillasPendientes) {
      this.planillasPendientes = planillasPendientes;
   }

   public BigDecimal getValorPlanillas() {
      return valorPlanillas;
   }

   public void setValorPlanillas(BigDecimal valorPlanillas) {
      this.valorPlanillas = valorPlanillas;
   }

   public BigDecimal getValorPendiente() {
      return valorPendiente;
   }

   public void setValorPendiente(BigDecimal valorPendiente) {
      this.valorPendiente = valorPendiente;
   }
}
