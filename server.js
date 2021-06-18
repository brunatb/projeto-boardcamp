import express from 'express';
import cors from 'cors';
import pg from 'pg';
import joi from 'joi';

const app = express();
app.use(cors());
app.use(express.json());

const { Pool } = pg;

const connection = new Pool ({
    user: 'bootcamp_role',
    password: 'senha_super_hiper_ultra_secreta_do_role_do_bootcamp',
    host: 'localhost',
    port: 5432,
    database: 'boardcamp'
})

app.get('/categories', async (req,res) => {
    try {
        const result = await connection.query('SELECT * FROM categories');
        return res.send(result.rows);
    }
    catch {
        return res.sendStatus(404)
    }
})

app.post('/categories', async (req,res) => {

    const schema = joi.object({
        name: joi.string().required()
    })
    const isValid = schema.validate(req.body)
    if(isValid.error) return res.sendStatus(400)

    try {
        const name = req.body.name
        const verifyName = await connection.query('SELECT * FROM categories WHERE name = $1', [name])
        console.log(verifyName)
        if (verifyName.rows.length) return res.sendStatus(409)

        await connection.query('INSERT INTO categories (name) VALUES ($1)', [req.body.name])
        return res.sendStatus(201)
    }
    catch {
        return res.sendStatus(404)
    }
})

app.get('/games', async (req,res) => {
    const name = req.query.name

    try {
        if(name) {
            const result = await connection.query('SELECT games.* categories.name FROM games JOIN categories ON games."categoryId" = categories.id WHERE name ILIKE $1', [`${name}%`]);
            return res.send(result.rows)
        }

        const result = await connection.query('SELECT games.*, categories.name FROM games JOIN categories ON games."categoryId" = categories.id')
        return res.status(201).send(result.rows)
    }
    catch {
        return res.sendStatus(404)
    }
})

app.post('/games', async (req,res) => {

    const {name, image, stockTotal, categoryId, pricePerDay} = req.body

    const schema = joi.object({
        name: joi.string().required(),
        image: joi.string().uri().required(),
        stockTotal: joi.number().positive().integer().required(),
        categoryId: joi.number().positive().integer().required(),
        pricePerDay: joi.number().positive().integer().required()
    })
    const isValid = schema.validate(req.body)
    if(isValid.error) return res.sendStatus(400)

    try{
        const categories = await connection.query('SELECT * FROM categories WHERE id = $1', [categoryId])
        if(!categories.rows.length) return res.sendStatus(400)
        
        const nameExists = await connection.query('SELECT * FROM games WHERE name = $1', [name])
        if(nameExists.rows.length) return res.sendStatus(409)

        await connection.query('INSERT INTO games (name, image, "stockTotal", "categoryId", "pricePerDay") VALUES ($1, $2, $3, $4, $5)', 
        [name, image, stockTotal, categoryId, pricePerDay])

        return res.sendStatus(201)
    }
    catch (e){
        console.log(e)
        return res.sendStatus(404)
    }
})

app.get('/customers', async (req,res) => { //falta testar
    const cpf = req.query.cpf

    try {
        if(cpf) {
            await connection.query('SELECT * FROM customers WHERE cpf ILIKE $1', [`${cpf}$`]);
            return res.send(result.rows)
        }
        const result = await connection.query('SELECT * FROM customers');
        return res.send(result.rows);
    }
    catch {
        return res.sendStatus(404)
    }
})

app.get('/customers/:id', async (req,res) => { //falta testar
    const id = +req.params.id

    try {
        const result = await connection.query('SELECT * FROM customers WHERE id = $1', [id])
        if(!result.rows.length) return res.sendStatus(404)
        return res.send(result.rows)
    }
    catch {
        return res.send(404)
    }
})

app.post('/customers', (req,res) => { //falta testar

    const {name, phone, cpf, birthday} = req.body

    const schema = joi.object ({
        name: joi.string().required(),
        cpf: joi.string().pattern(/^[0-9]{3}\.[0-9]{3}\.[0-9]{3}\-[0-9]{2}$/, "CPF inválido"),
        phone: joi.string().pattern(/{10,11}/),
        birthday: joi.date().format('YYYY-MM-DD').utc()
    })
    const isValid = schema.validate(req.body)
    if (isValid.error) return res.sendStatus(400)

    try {
        const cpfExists = await connection.query('SELECT * FROM customers WHERE cpf = $1', [cpf])
        if(cpfExists.rows.length) return res.sendStatus(409)
        await connection.query('INSERT INTO customers (name, phone, cpf, birthday) VALUES ($1, $2, $3, $4)', [name, phone, cpf, birthday])
        return res.sendStatus(201)
    }
    catch {
        return res.sendStatus(404)
    }
})

app.put('/customers/:id', (req,res) => {

    const id = +req.params.id
    const {name, phone, cpf, birthday} = req.body

    const schema = joi.object ({
        name: joi.string().required(),
        cpf: joi.string().pattern(/^[0-9]{3}\.[0-9]{3}\.[0-9]{3}\-[0-9]{2}$/, "CPF inválido"),
        phone: joi.string().pattern(/{10,11}/),
        birthday: joi.date().format('YYYY-MM-DD').utc()
    })
    const isValid = schema.validate(req.body)
    if (isValid.error) return res.sendStatus(400)


    try {
        const cpfExists = await connection.query('SELECT * FROM customers WHERE cpf = $1', [cpf])
        if(cpfExists.rows.length) return res.sendStatus(409)
    
        const update = await connection.query('UPDATE customers (name, cpf, phone, birthday) SET ($1, $2, $3, $4) WHERE id = $5;', [name, cpf, phone, birthday, id])
        return res.sendStatus(200)
    }
    catch {
        return res.sendStatus(404)
    }
})

app.get('/rentals', (req,res) => {
    //Response: lista com todos os aluguéis, contendo o customer e o game do aluguel em questão em cada aluguel
    //Regras: 
    //Caso seja passado um parâmetro customerId na query string da requisição, 
    //os aluguéis devem ser filtrados para retornar somente os do cliente solicitado. 
    //Caso seja passado um parâmetro gameId na query string da requisição, 
    //os aluguéis devem ser filtrados para retornar somente os do jogo solicitado.
})

app.post('/rentals', (req,res) => {
    //Request: body no formato: {customerId: 1,gameId: 1,daysRented: 3}
    //Response: status 201, sem dados
    //Regras: 
})

app.post('/rentals/:id/return', (req,res) => {
    //Response: status 200, sem dados
    //Regras:
})

app.delete('/rentals/:id', (req,res) => {
    //Response: status 200, sem dados
    //Regras
    //Ao excluir um aluguel, deve verificar se o id fornecido existe. Se não, deve responder com status 404
    //Ao excluir um aluguel, deve verificar se o aluguel já não está finalizado (ou seja, returnDate já está preenchido). 
    //Se estiver, deve responder com status 400
})

app.listen(4000);