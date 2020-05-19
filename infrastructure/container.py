from infrastructure.services.notification.mailjet_notification_service import MailjetNotificationService
from infrastructure.repository.booking.booking_sql_repository import BookingSQLRepository
from infrastructure.repository.stock.stock_sql_repository import StockSQLRepository
from infrastructure.repository.beneficiary.beneficiary_sql_repository import BeneficiarySQLRepository
from use_cases.book_an_offer import BookAnOffer
from use_cases.save_offerer_bank_informations import SaveOffererBankInformations
from use_cases.save_venue_bank_informations import SaveVenueBankInformations

# Repositories
booking_repository = BookingSQLRepository()
user_repository = BeneficiarySQLRepository()
stock_repository = StockSQLRepository()
notification_service = MailjetNotificationService()

# Usecases
book_an_offer = BookAnOffer(booking_repository=booking_repository,
                            user_repository=user_repository,
                            stock_repository=stock_repository,
                            notification_service=notification_service)
