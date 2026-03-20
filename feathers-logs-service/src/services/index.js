export const services = app => {
  app.get('/test', (req, res) => {
    res.send({})
  });
}
