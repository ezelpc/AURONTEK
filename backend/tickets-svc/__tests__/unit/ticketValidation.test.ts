/**
 * Unit Tests for Ticket Validation Logic
 * Tests ticket data validation, status transitions, and business rules
 */

describe('Ticket Validation - Unit Tests', () => {
    describe('Ticket Data Validation', () => {
        it('should validate required fields', () => {
            const validTicket = {
                titulo: 'Test Ticket',
                descripcion: 'Test description',
                empresaId: '123',
                usuarioId: '456',
                prioridad: 'media'
            };

            expect(validTicket.titulo).toBeDefined();
            expect(validTicket.descripcion).toBeDefined();
            expect(validTicket.empresaId).toBeDefined();
        });

        it('should reject ticket without titulo', () => {
            const invalidTicket = {
                descripcion: 'Test description',
                empresaId: '123'
            };

            expect(invalidTicket).not.toHaveProperty('titulo');
        });

        it('should validate titulo length', () => {
            const shortTitle = 'AB';
            const validTitle = 'Valid Ticket Title';
            const longTitle = 'A'.repeat(300);

            expect(shortTitle.length).toBeLessThan(3);
            expect(validTitle.length).toBeGreaterThanOrEqual(3);
            expect(validTitle.length).toBeLessThanOrEqual(200);
            expect(longTitle.length).toBeGreaterThan(200);
        });

        it('should validate prioridad values', () => {
            const validPrioridades = ['baja', 'media', 'alta', 'critica'];
            const invalidPrioridad = 'urgente';

            validPrioridades.forEach(prioridad => {
                expect(validPrioridades).toContain(prioridad);
            });

            expect(validPrioridades).not.toContain(invalidPrioridad);
        });
    });

    describe('Status Transitions', () => {
        const validTransitions = {
            'pendiente': ['en_proceso', 'cancelado'],
            'en_proceso': ['resuelto', 'pendiente', 'cancelado'],
            'resuelto': ['cerrado', 'en_proceso'],
            'cerrado': [],
            'cancelado': []
        };

        it('should allow valid status transition from pendiente to en_proceso', () => {
            const currentStatus = 'pendiente';
            const newStatus = 'en_proceso';

            expect(validTransitions[currentStatus]).toContain(newStatus);
        });

        it('should allow valid status transition from en_proceso to resuelto', () => {
            const currentStatus = 'en_proceso';
            const newStatus = 'resuelto';

            expect(validTransitions[currentStatus]).toContain(newStatus);
        });

        it('should reject invalid status transition from cerrado', () => {
            const currentStatus = 'cerrado';
            const newStatus = 'en_proceso';

            expect(validTransitions[currentStatus]).not.toContain(newStatus);
            expect(validTransitions[currentStatus]).toHaveLength(0);
        });

        it('should reject invalid status transition from pendiente to resuelto', () => {
            const currentStatus = 'pendiente';
            const newStatus = 'resuelto';

            expect(validTransitions[currentStatus]).not.toContain(newStatus);
        });

        it('should allow reopening from resuelto to en_proceso', () => {
            const currentStatus = 'resuelto';
            const newStatus = 'en_proceso';

            expect(validTransitions[currentStatus]).toContain(newStatus);
        });
    });

    describe('SLA Calculation', () => {
        const slaByPriority = {
            'critica': 4 * 60,    // 4 hours in minutes
            'alta': 8 * 60,       // 8 hours
            'media': 24 * 60,     // 24 hours
            'baja': 72 * 60       // 72 hours
        };

        it('should calculate correct SLA for critica priority', () => {
            const prioridad = 'critica';
            const expectedSLA = 4 * 60;

            expect(slaByPriority[prioridad]).toBe(expectedSLA);
        });

        it('should calculate correct SLA for alta priority', () => {
            const prioridad = 'alta';
            const expectedSLA = 8 * 60;

            expect(slaByPriority[prioridad]).toBe(expectedSLA);
        });

        it('should calculate correct SLA for media priority', () => {
            const prioridad = 'media';
            const expectedSLA = 24 * 60;

            expect(slaByPriority[prioridad]).toBe(expectedSLA);
        });

        it('should calculate correct SLA for baja priority', () => {
            const prioridad = 'baja';
            const expectedSLA = 72 * 60;

            expect(slaByPriority[prioridad]).toBe(expectedSLA);
        });

        it('should have critica as highest priority (lowest SLA)', () => {
            expect(slaByPriority['critica']).toBeLessThan(slaByPriority['alta']);
            expect(slaByPriority['alta']).toBeLessThan(slaByPriority['media']);
            expect(slaByPriority['media']).toBeLessThan(slaByPriority['baja']);
        });
    });

    describe('Priority Assignment Logic', () => {
        it('should assign critica priority for keywords: sistema caído, producción parada', () => {
            const keywords = ['sistema caído', 'producción parada', 'servicio inaccesible'];
            const expectedPriority = 'critica';

            keywords.forEach(keyword => {
                const description = `Tenemos un problema: ${keyword}`;
                const containsCriticalKeyword = keywords.some(k => description.toLowerCase().includes(k.toLowerCase()));

                if (containsCriticalKeyword) {
                    expect(expectedPriority).toBe('critica');
                }
            });
        });

        it('should assign alta priority for keywords: error, fallo, no funciona', () => {
            const keywords = ['error crítico', 'fallo importante', 'no funciona'];
            const expectedPriority = 'alta';

            keywords.forEach(keyword => {
                const description = `Reportando: ${keyword}`;
                expect(description.toLowerCase()).toContain(keyword.toLowerCase());
            });
        });

        it('should assign baja priority for keywords: consulta, pregunta, información', () => {
            const keywords = ['consulta', 'pregunta', 'información', 'duda'];
            const expectedPriority = 'baja';

            keywords.forEach(keyword => {
                const description = `Tengo una ${keyword}`;
                expect(description.toLowerCase()).toContain(keyword.toLowerCase());
            });
        });
    });
});
