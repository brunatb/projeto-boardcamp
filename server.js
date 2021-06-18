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
            await connection.query('SELECT games.* categories.name FROM games JOIN categories ON games."categoryId" = categories.id WHERE name ILIKE $1', [name + '%']);
            return res.send('sucesso')
        }
    
        const result = await connection.query('SELECT games.*, categories.name FROM games JOIN categories ON games."categoryId" = categories.id')
        return res.status(201).send(result)
    }
    catch {
        return res.sendStatus(404)
    }
    //Response: lista dos jogos encontrados, seguindo o formato abaixo (incluindo o nome da categoria conforme destacado)
    //Regras:
    //Caso seja passado um parâmetro name na query string da requisição, 
    //os jogos devem ser filtrados para retornar somente os que começam com a string passada (case insensitive).
    //Para a rota /games?name=ba, deve ser retornado uma array somente com os jogos que comecem com "ba", como "Banco Imobiliário", "Batalha Naval", etc
})

app.post('/games', async (req,res) => {

    const {name, image, stockTotal, categoryId, pricePerDay} = req.body

    try{
        const result = await connection.query('INSERT INTO games (name, image, "stockTotal", "categoryId", "pricePerDay") VALUES ($1, $2, $3, $4, $5)', 
        [name, image, stockTotal, categoryId, pricePerDay])

        return res.sendStatus(201)
    }
    catch (e){
        return res.sendStatus(404) && console.log(e)
    }
    //Request: body no formato:{name: 'Banco Imobiliário', image: 'http://', stockTotal: 3, categoryId: 1, pricePerDay: 1500}
    //Response: status 201, sem dados
    //Regras: 
    //name não pode estar vazio; 
    //stockTotal e pricePerDay devem ser maiores que 0; 
    //categoryId deve ser um id de categoria existente; 
    //⇒ nesses casos, deve retornar status 400
    //name não pode ser um nome de jogo já existente ⇒ nesse caso deve retornar status 409
})

app.get('/customers', (req,res) => {
    //Response: lista com todos os clientes
    //Regras: Caso seja passado um parâmetro cpf na query string da requisição, 
    //os clientes devem ser filtrados para retornar somente os com CPF que comecem com a string passada
})

app.get('/customers/:id', (req,res) => {
    //Response: somente o objeto do usuário com o id passado
    //Se o cliente com id dado não existir, deve responder com status 404
})

app.post('/customers', (req,res) => {
    //Request: body no formato: {name: 'João Alfredo', phone: '21998899222', cpf: '01234567890', birthday: '1992-10-05'}
    //Response: status 201, sem dados
    //Regras: 
    //- `cpf` deve ser uma string com 11 caracteres numéricos; 
    //`phone` deve ser uma string com 10 ou 11 caracteres numéricos; 
    //`name` não pode ser uma string vazia; 
    //`birthday` deve ser uma data válida; 
    //⇒ nesses casos, deve retornar **status 400**
    //cpf não pode ser de um cliente já existente; ⇒ nesse caso deve retornar status 409
})

app.put('/customers/:id', (req,res) => {
    //Request: body no formato: {name: 'João Alfredo',phone: '21998899222',cpf: '01234567890',birthday: '1992-10-05'}
    //Response: status 200, sem dados
    //Regras:
    //cpf deve ser uma string com 11 caracteres numéricos; 
    //phone deve ser uma string com 10 ou 11 caracteres numéricos; 
    //name não pode ser uma string vazia; 
    //birthday deve ser uma data válida 
    //⇒ nesses casos, deve retornar status 400
    //cpf não pode ser de um cliente já existente ⇒ nesse caso deve retornar status 409
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