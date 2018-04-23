'use strict';


class Queries {
    constructor(models) {
        this.Tag = models.Tag;
        this.User = models.User;
        this.Country = models.Country;
        this.Review = models.Review;
        this.sequelize = models.sequelize;
        this.Op = this.sequelize.Op;
        this.Souvenir = models.Souvenir;
    }

    // Далее идут методы, которые вам необходимо реализовать:

    getAllSouvenirs() {
        return this.Souvenir.findAll();
    }

    getCheapSouvenirs(price) {
        return this.Souvenir.findAll({
            where: {
                price: {
                    [this.Op.lte]: price
                }
            }
        });
    }

    getTopRatingSouvenirs(n) {
        return this.Souvenir.findAll({
            order: [
                ['rating', 'DESC']
            ],
            limit: n
        });
    }

    getSouvenirsByTag(tag) {
        return this.Souvenir.findAll({
            attributes: ['id', 'name', 'image', 'price', 'rating'],
            include: {
                model: this.Tag,
                where: { name: tag },
                attributes: []
            }
        });
    }

    getSouvenirsCount({ country, rating, price }) {
        return this.Souvenir.count({
            where: {
                rating: {
                    [this.Op.gte]: rating
                },
                price: {
                    [this.Op.lte]: price
                }
            },
            include: {
                model: this.Country,
                where: {
                    name: country
                },
                attributes: ['name']
            }
        });
    }

    searchSouvenirs(substring) {
        return this.Souvenir.findAll({
            where: {
                name: {
                    [this.Op.iLike]: `%${substring}%`
                }
            }
        });
    }

    getDisscusedSouvenirs(n) {
        return this.Souvenir.findAll({
            attributes: ['id', 'name', 'image', 'price', 'rating'],
            include: {
                model: this.Review,
                attributes: []
            },
            group: 'souvenirs.id',
            having: this.sequelize.where(
                this.sequelize.fn('COUNT', this.sequelize.col('reviews.id')), '>=', n
            )
        });
    }

    deleteOutOfStockSouvenirs() {
        return this.Souvenir.destroy({
            where: {
                amount: 0
            }
        });
    }

    addReview(souvenirId, { login, text, rating }) {
        return this.sequelize.transaction(async transaction => {
            const souvenir = await this.Souvenir.findById(souvenirId);
            const user = await this.User.findOne({
                where: { login }
            });
            await this.Review.create({
                text,
                rating,
                souvenirId,
                userId: user.id
            }, { transaction });

            const reviews = await this.Review.findAll({
                where: { souvenirId }
            });
            const newRating = reviews
                .reduce((prev, current) => prev + current.rating, 0) / reviews.length;
            await souvenir.update({ rating: newRating }, { transaction });
        });
    }

    getCartSum(login) {
        // Данный метод должен считать общую стоимость корзины пользователя login
        // У пользователя может быть только одна корзина, поэтому это тоже можно отразить
        // в модели.
        return login;
    }
}

module.exports = Queries;
