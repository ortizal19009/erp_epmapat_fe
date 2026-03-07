export const environment = {
  production: true,
  //API_URL: 'http://192.168.0.71:9090'
  API_URL: 'http://192.168.0.88:8888/erp_epmapat-v0.1',
  SWAGGER_GATEWAYS: [
    { key: 'prod', label: 'Producción', baseUrl: 'http://192.168.0.88:8080' },
    { key: 'qa', label: 'QA', baseUrl: 'http://192.168.0.88:8081' },
    { key: 'dev', label: 'Desarrollo', baseUrl: 'http://localhost:8080' }
  ]
  //API_URL: 'http://192.168.100.16:9080/erp_epmapat-v0.1'
};
