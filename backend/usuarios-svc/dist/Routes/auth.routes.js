"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = __importDefault(require("../Controllers/auth.controller"));
const auth_middleware_1 = require("../Middleware/auth.middleware");
const router = express_1.default.Router();
router.post('/login', auth_controller_1.default.login);
router.post('/register', [auth_middleware_1.verificarToken, auth_middleware_1.esAdminInterno], auth_controller_1.default.register);
router.post('/logout', auth_middleware_1.verificarToken, auth_controller_1.default.logout);
router.get('/check', auth_middleware_1.verificarToken, auth_controller_1.default.check);
exports.default = router;
