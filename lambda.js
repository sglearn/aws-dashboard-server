"use strict"

const aws = require('aws-sdk');
const lambda = new aws.Lambda();

function sendEmailFn(functionName) {
  return function sendEmail({recipient, courses, customer}, callback) {

    console.log(`Sending email to ${recipient}`)

    lambda.invoke(
      {
        FunctionName: functionName,
        InvocationType: "Event",
        Payload: JSON.stringify({recipient, courses, customer}, null, 2)
      },
      function(err, data) {
        if (err) {
          console.log(err)
          callback(err)
        } else {
          console.log('Send Email success')
          callback()
        }
      }
    )

  }
}

/* create api */  

const api = require('@sglearn/dashboard-server')

const DatabaseAbstractor = require("database-abstractor")
const invoice = new DatabaseAbstractor();
const enroll = new DatabaseAbstractor();

invoice.use(require('@sglearn/invoicedb-dynamodb-driver')());
enroll.use(require('@sglearn/enrolldb-dynamodb-driver')());

api.useDatabase({ invoice, enroll })

api.helper({ sendEmail: sendEmailFn('SendEmailNotifyEnrollActivated') })

/* create express app from api */  
const express = require('express')
const cors = require('cors')

const app = express();

app.use(cors());

app.use('/', api);

/* wrap into lambda */  
const awsServerlessExpress = require('aws-serverless-express')
const server = awsServerlessExpress.createServer(app)
exports.handler = (event, context) => {
  awsServerlessExpress.proxy(server, event, context)
}
