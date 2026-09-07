import fs from 'fs';
import Sequelize from 'sequelize';
import relations from './relations.ts';
import { loadConfig } from '../helpers/config.ts';

const NODE_ENV = process.env.NODE_ENV || 'local';
// resolved from cwd (backend/): works for tsx, vitest, dist and pm2 alike
const config = loadConfig(NODE_ENV);
const DIALECT = config['dialect'] || process.env.DB_DIALECT || 'mysql';

const db: any = {};

let sequelize_config;

if (NODE_ENV == 'production') {
  sequelize_config = {
    host: config["db-connection"].host,
    dialect: DIALECT,
    pool: {
      max: 50,
      min: 0,
      acquire: 1000000,
      idle: 200000
    },
    ...(config["db-connection"].socketPath ? { dialectOptions: { socketPath: config["db-connection"].socketPath } } : {}),
    logging: false,
    port: config["db-connection"].port || 3306,
  }
} else {
  sequelize_config = {
    host: config["db-connection"].host,
    dialect: DIALECT,
    pool: {
      // Tests hit endpoints that leak transactions (pinned bugs like
      // job.createReview never committing); a larger pool keeps the suite
      // from starving while those connections drain on teardown.
      max: NODE_ENV === 'test' ? 40 : 5,
      min: 0,
      acquire: 30000,
      idle: 60000
    },
    logging: false,
    port: config["db-connection"].port,
  }
}

const sequelizeClient = new Sequelize(
  config["db-connection"].database,
  config["db-connection"].user,
  config["db-connection"].password,
  sequelize_config
)

db.Sequelize = Sequelize;
db.sequelize = sequelizeClient;

// static import map (kept in sync with the model files by convention; the
// previous readdirSync/require loader cannot live in an ESM module)
import AddressFactory from './Address.ts';
import AdminFactory from './Admin.ts';
import AdminHistoryFactory from './AdminHistory.ts';
import BannerFactory from './Banner.ts';
import BannerLanguageFactory from './BannerLanguage.ts';
import BizCustomerFactory from './BizCustomer.ts';
import ChargeFactory from './Charge.ts';
import CleaningSupplyFactory from './CleaningSupply.ts';
import CreditCardFactory from './CreditCard.ts';
import CustomerFactory from './Customer.ts';
import CustomerSupplyFactory from './CustomerSupply.ts';
import CustomerSupplyDetailFactory from './CustomerSupplyDetail.ts';
import DistrictFactory from './District.ts';
import ErrorLogFactory from './ErrorLog.ts';
import ImportDataFactory from './ImportData.ts';
import JobFactory from './Job.ts';
import JobDetailFactory from './JobDetail.ts';
import JobReviewFactory from './JobReview.ts';
import ProvinceFactory from './Province.ts';
import PurchaseOrderFactory from './PurchaseOrder.ts';
import PurchaseOrderDetailFactory from './PurchaseOrderDetail.ts';
import RequestDriverFactory from './RequestDriver.ts';
import RequestHelperFactory from './RequestHelper.ts';
import RequestHelperStatusFactory from './RequestHelperStatus.ts';
import RequestMaidFactory from './RequestMaid.ts';
import RoleFactory from './Role.ts';
import SubDistrictFactory from './SubDistrict.ts';
import SubscriptionFactory from './Subscription.ts';
import SubscriptionTransactionFactory from './SubscriptionTransaction.ts';
import SupplierFactory from './Supplier.ts';
import SupplierProductFactory from './SupplierProduct.ts';
import SupplyOrderFactory from './SupplyOrder.ts';
import SupplyOrderDetailFactory from './SupplyOrderDetail.ts';
import SupporterFactory from './Supporter.ts';
import SupporterEducationFactory from './SupporterEducation.ts';
import SupporterExperienceFactory from './SupporterExperience.ts';
import SupporterLanguageFactory from './SupporterLanguage.ts';
import SupporterSkillFactory from './SupporterSkill.ts';
import SupporterViewCountFactory from './SupporterViewCount.ts';

const modelFactories: any = {
  Address: AddressFactory,
  Admin: AdminFactory,
  AdminHistory: AdminHistoryFactory,
  Banner: BannerFactory,
  BannerLanguage: BannerLanguageFactory,
  BizCustomer: BizCustomerFactory,
  Charge: ChargeFactory,
  CleaningSupply: CleaningSupplyFactory,
  CreditCard: CreditCardFactory,
  Customer: CustomerFactory,
  CustomerSupply: CustomerSupplyFactory,
  CustomerSupplyDetail: CustomerSupplyDetailFactory,
  District: DistrictFactory,
  ErrorLog: ErrorLogFactory,
  ImportData: ImportDataFactory,
  Job: JobFactory,
  JobDetail: JobDetailFactory,
  JobReview: JobReviewFactory,
  Province: ProvinceFactory,
  PurchaseOrder: PurchaseOrderFactory,
  PurchaseOrderDetail: PurchaseOrderDetailFactory,
  RequestDriver: RequestDriverFactory,
  RequestHelper: RequestHelperFactory,
  RequestHelperStatus: RequestHelperStatusFactory,
  RequestMaid: RequestMaidFactory,
  Role: RoleFactory,
  SubDistrict: SubDistrictFactory,
  Subscription: SubscriptionFactory,
  SubscriptionTransaction: SubscriptionTransactionFactory,
  Supplier: SupplierFactory,
  SupplierProduct: SupplierProductFactory,
  SupplyOrder: SupplyOrderFactory,
  SupplyOrderDetail: SupplyOrderDetailFactory,
  Supporter: SupporterFactory,
  SupporterEducation: SupporterEducationFactory,
  SupporterExperience: SupporterExperienceFactory,
  SupporterLanguage: SupporterLanguageFactory,
  SupporterSkill: SupporterSkillFactory,
  SupporterViewCount: SupporterViewCountFactory,
};
for (const [modelName, factory] of Object.entries(modelFactories)) {
  if (typeof factory !== 'function') {
    console.error('BAD FACTORY:', modelName, typeof factory);
  }
  db[modelName] = factory(sequelizeClient, Sequelize);
}

relations(db);

export default db;
export const sequelize = db.sequelize;

export const Address = db.Address;
export const Admin = db.Admin;
export const AdminHistory = db.AdminHistory;
export const Banner = db.Banner;
export const BannerLanguage = db.BannerLanguage;
export const BizCustomer = db.BizCustomer;
export const Charge = db.Charge;
export const CleaningSupply = db.CleaningSupply;
export const CreditCard = db.CreditCard;
export const Customer = db.Customer;
export const CustomerSupply = db.CustomerSupply;
export const CustomerSupplyDetail = db.CustomerSupplyDetail;
export const District = db.District;
export const ErrorLog = db.ErrorLog;
export const ImportData = db.ImportData;
export const Job = db.Job;
export const JobDetail = db.JobDetail;
export const JobReview = db.JobReview;
export const Province = db.Province;
export const PurchaseOrder = db.PurchaseOrder;
export const PurchaseOrderDetail = db.PurchaseOrderDetail;
export const RequestDriver = db.RequestDriver;
export const RequestHelper = db.RequestHelper;
export const RequestHelperStatus = db.RequestHelperStatus;
export const RequestMaid = db.RequestMaid;
export const Role = db.Role;
export const SubDistrict = db.SubDistrict;
export const Subscription = db.Subscription;
export const SubscriptionTransaction = db.SubscriptionTransaction;
export const Supplier = db.Supplier;
export const SupplierProduct = db.SupplierProduct;
export const SupplyOrder = db.SupplyOrder;
export const SupplyOrderDetail = db.SupplyOrderDetail;
export const Supporter = db.Supporter;
export const SupporterEducation = db.SupporterEducation;
export const SupporterExperience = db.SupporterExperience;
export const SupporterLanguage = db.SupporterLanguage;
export const SupporterSkill = db.SupporterSkill;
export const SupporterViewCount = db.SupporterViewCount;

