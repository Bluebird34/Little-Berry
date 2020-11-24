let express = require('express')
let app = express()

app.get("/", (req, res) => {
    res.send("Hello little Berry")
})
app.listen(process.env.PORT||3000)