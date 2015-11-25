var assert = require('assert')
var request = require('supertest')
var path = require('path')
var Reporter = require('jsreport-core').Reporter

describe('images', function () {
  var reporter

  beforeEach(function (done) {
    reporter = new Reporter({
      rootDirectory: path.join(__dirname, '../')
    })

    reporter.init().then(function () {
      done()
    }).fail(done)
  })

  it('shoulb be able to upload', function (done) {
    reporter.images.upload('test', 'image/jpeg', new Buffer([1, 2, 3]))
      .then(function () {
        return reporter.documentStore.collection('images').find()
      })
      .then(function (res) {
        assert.equal(1, res.length)
        done()
      }).catch(done)
  })

  it('express get by name for not existing image should return not found', function (done) {
    request(reporter.express.app)
      .get('/api/image/name/foo')
      .expect(404, done)
  })

  it('express post and get by name should return image', function (done) {
    request(reporter.express.app)
      .post('/api/image')
      .attach('avatar', path.join(__dirname, 'testImg.png'))
      .field('originalname', 'testImg')
      .expect(200)
      .set('Accept', 'application/json')
      .end(function (err, res) {
        if (err) {
          throw err
        }

        assert.notEqual(null, JSON.parse(res.text).shortid)

        request(reporter.express.app)
          .get('/api/image/name/testImg')
          .expect(200, done)
      })
  })

  it('should replace image tag with base64 content', function (done) {
    reporter.images.upload('test withSpace', 'image/jpeg', new Buffer([1, 2, 3]))
      .then(function () {
        var request = {}

        var response = {
          content: new Buffer('a{#image test withSpace}')
        }

        reporter.images.handleAfterTemplatingEnginesExecuted(request, response).then(function () {
          assert.equal(response.content.toString(), 'adata:image/jpegbase64,' + new Buffer([1, 2, 3]).toString('base64'))
          done()
        }).catch(done)
      }).catch(done)
  })
})