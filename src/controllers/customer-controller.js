'use strict';

//Importação de validação de dados
const ValidationContract = require('../validators/fluent-validator');
const repository = require('../repositories/customer-repository');
const md5 = require('md5');
const emailService = require('../services/email-services');
const authService = require('../services/auth-services');

// Salvar Clientes na tabela
exports.post = async (req, res, next) => {
    let contract = new ValidationContract();
    contract.hasMinLen(req.body.name, 3, 'O nome deve conter mais de 3 caracteres');
    contract.isEmail(req.body.email, 'E-Mail Inválido');
    contract.hasMinLen(req.body.password, 6, 'A Senha deve conter mais de 5 caracteres');
 
    //Se os dados forem inválidos
    if (!contract.isValid()){
        res.status(400).send(contract.errors()).end();
        return;
    }
    try{
      await repository.create({
          name: req.body.name,
          email: req.body.email,
          password: md5(req.body.password + global.SALT_KEY),
          roles: ["user"]

      });
     // Envio de EMail
     emailService.send(req.body.email,
         'Bem vindo a RBPendrives', 
         global.EMAIL_TMPL.replace('{0}', req.body.name));

    res.status(201).send({ 
         message: 'Cliente cadastrado com sucesso!'
        });
    }catch (e) {
        res.status(500).send({
            message: 'Falha ao Cadastrar Cliente'
       });
    }
};

// Salvar Cliente com senha
exports.authenticate = async (req, res, next) => {
    try{
     const customer = await repository.authenticate({
          email: req.body.email,
          password: md5(req.body.password + global.SALT_KEY)
      });
       
       if(!customer){
           res.status(404).send({
               message: 'Usuário ou senha Inválidos'
           });
           return;
       }

      const token = await authService.generateToken({
          id: customer._id,
          email: customer.email,
          name: customer.name,
          roles: customer.roles
      }
    );
     
    res.status(201).send({ 
         token: token,
         data:{
            email: customer.email,
            name: customer.name 
         }
        });
    }catch (e) {
        res.status(500).send({
            message: 'Falha ao Cadastrar Cliente'
       });
    }
};

// Atualiza Token
exports.refreshToken = async (req, res, next) => {
    try{
    
      const token = req.body.token || req.query.token || req.headers['x-access-token'];
      const data = await authService.decodeToken(token);

      const customer = await repository.getById(data.id);
       
       if(!customer){
           res.status(404).send({
               message: 'Cliente não encontrado'
           });
           return;
       }

      const tokenData = await authService.generateToken({
          id: customer._id,
          email: customer.email,
          name: customer.name,
          roles: customer.roles
      }
    );
     
    res.status(201).send({ 
         token: token,
         data:{
            email: customer.email,
            name: customer.name 
         }
        });
    }catch (e) {
        res.status(500).send({
            message: 'Falha na Requisição'
       });
    }
};

