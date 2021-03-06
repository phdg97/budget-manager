const express = require('express')
const router = express.Router()
const middleware = require('../../middlewares/middlewares')
const User = require('../../models/user')
const Budget = require('../../models/budget')

router.get('/budget', middleware.isLoggedIn, (req, res) => {
	res.render('budget/select')
})
router.get('/budget/:month', middleware.isLoggedIn, (req, res) => {
	Budget.findOne({owner_id: req.user._id, month: req.query.month }, (err, budget) => {
		if (err) {
			console.log(err)
		} else {
			let totalExpenses = totals(budget.expenses)
			let totalIncomes = totals(budget.incomes)
			let total = totalIncomes - totalExpenses 
			res.render(`budget/budget`, {budget: budget, total: parseFloat(total)})
		}
	})
})
router.post('/budget', middleware.isLoggedIn, (req, res) => {
	let data = { description: req.body.description, value: req.body.value }
	Budget.findOne({ owner_id: req.user._id, month: req.body.month }, (err, budget) => {
		if (err || !budget) {
			let newBudget = {
				owner_id: req.user._id,
				month: req.body.month,
				incomes: [{}],
				expenses: [{}]
			}
			req.body.type === 'income' ? newBudget.incomes.push(data) : newBudget.expenses.push(data)
			Budget.create(newBudget, (err, budget) => {
				if (err) {
					console.log(err)
				} else {
					res.redirect(`/budget/month?month=${req.body.month}`)
				}
			})
		} else {
			req.body.type === 'income' ? budget.incomes.push(data) : budget.expenses.push(data)
			budget.save()
			res.redirect(`/budget/month?month=${req.body.month}`)
		}
	})
})
router.get('/budget/:id/:type/:id_item/edit', middleware.isLoggedIn, (req, res) => {
	Budget.findById(req.params.id, (err, budget) => {
		if (err) {
			console.log(err)
		} else {
			let item = {}
			budget[req.params.type].forEach((current) => {
				if (current._id.equals(req.params.id_item)) {
					item = current
				}
			})
			let totalExpenses = totals(budget.expenses)
			let totalIncomes = totals(budget.incomes)
			let total = totalIncomes - totalExpenses 
			res.render('budget/edit', { budget: budget, item: item, type: req.params.type, total: total })
		}
	})
})
router.put('/budget/:id/:type/:id_item', middleware.isLoggedIn, (req, res) => {
	Budget.findById(req.params.id, (err, budget) => {
		if (err) {
			console.log(err)
		} else {
			let item = req.body.item
			budget[req.params.type].forEach((current, index) => {
				if (current._id.equals(req.params.id_item)) {
					current.description = item.description
					current.value = item.value
					budget.save()
				}
			})
		}
		res.redirect(`/budget/month?month=${budget.month}`)
	})
})
router.delete('/budget/:id/:type/:id_item', middleware.isLoggedIn, (req, res) => {
	Budget.findById(req.params.id, (err, budget) => {
		if (err) {
			console.log(err)
		} else {
			let removeIndex;
			budget[req.params.type].forEach((current, index) => {
				if (current._id.equals(req.params.id_item)) {
					removeIndex = index
				}
			})
			budget[req.params.type].splice(removeIndex, 1)
			budget.save()
		}
		res.redirect(`/budget/month?month=${budget.month}`)
	})
})

function totals(array) {
	let total = 0
	for (item of array) {
		if (item.value) {
			total += parseFloat(item.value)
		}
	}
	return total
}
module.exports = router;