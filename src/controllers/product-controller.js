'use strict';

//Importação de validação de dados
const ValidationContract = require('../validators/fluent-validator');
const repository = require('../repositories/product-repository');
const azure = require('azure-storage');
const guid = require('guid');
var config = require('../config');

//Listar Produtos
exports.get = async (req, res, next) => {
 try{
    var data = await repository.get();    
    res.status(200).send(data);
 } catch (e) {
     res.status(500).send({
         message: 'Falha ao Processar sua requisição'
     });
   }

}
//Listar Produtos Slug
exports.getBySlug = async(req, res, next) => {
   try{
    var data = await repository.getBySlug(req.params.slug);
     res.status(200).send(data);
    }catch (e) {
        res.status(500).send({
            message: 'Falha ao Processar sua requisição'
        });
      }
   }

//Listar Produtos Tags
exports.getByTag = async(req, res, next) => {
    try{
 var data = await repository.getByTag(req.params.tag);
       res.status(200).send(data);
    }catch (e) {
        res.status(500).send({
            message: 'Falha ao Processar sua requisição'
        });
      }
}
//Listar Produtos ID
exports.getById = async (req, res, next) => {
   try{
       var data = await repository.getById(req.params.id);
       res.status(200).send(data);
    }catch (e) {
        res.status(500).send({
            message: 'Falha ao Processar sua requisição'
        });
      }
}

// Salvar produtos na tabela
exports.post = async (req, res, next) => {
    let contract = new ValidationContract();
    contract.hasMinLen(req.body.title, 3, 'O título deve conter mais de 3 caracteres');
    contract.hasMinLen(req.body.slug, 3, 'O título deve conter mais de 3 caracteres');
    contract.hasMinLen(req.body.description, 3, 'O título deve conter mais de 3 caracteres');
 //Se os dados forem inválidos
    if (!contract.isValid()){
        res.status(400).send(contract.errors()).end();
        return;
    }
    
    try{
        // Cria o Blob Service
        const blobSvc = azure.createBlobService(config.containerConnectionString);

        let filename = guid.raw().toString() + '.jpg';
        let rawdata = req.body.image;
        let matches = rawdata.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        let type = matches[1];
        let buffer = new Buffer(matches[2], 'base64');
        
           // Salva a imagem
           await blobSvc.createBlockBlobFromText('product-images', filename, buffer, {
            contentType: type
        }, function (error, result, response) {
            if (error) {
                filename = 'default-product.png'
            }
        });

     await repository.create({
        title: req.body.title,
        slug: req.body.slug,
        description: req.body.description,
        price: req.body.price,
        active: true,
        tags: req.body.tags,
        image: 'https://rbpendrives.blob.core.windows.net/product-images/' + filename
     });
       res.status(201).send({ message: 'Produto Cadastrado!'});
         message: 'Produto cadastrado com sucesso!'
           }catch (e) {
               console.log(e);
        res.status(500).send({
            message: 'Falha ao Processar sua requisição'
           });
      }
   };


//Atualizar Produto

exports.put = async (req, res, next)=> {
 try {
    await repository.update(req.params.id, req.body)
    res.status(200).send({ 
        message: 'Produto Atualizado com sucesso!'});
    }catch (e) {
        res.status(500).send({
            message: 'Falha ao Processar sua requisição'
        });
      }
    };
    
   // Metodo Delete
exports.delete = async (req, res, next) => {
  try {
    await repository.delete(req.body.id)
    res.status(200).send({ message: 'Produto Excluido com sucesso!'});
          }catch (e) {
            res.status(500).send({
                message: 'Falha ao Processar sua requisição'
            });
          }
     };