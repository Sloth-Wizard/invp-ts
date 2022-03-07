import { InVp } from '../invp';
import template from './html/long_body.html';

describe('In Viewport', () => {
    beforeAll(() => {
        document.body.innerHTML += template;
    });

    /**
     * Get's the elements
     */
    test('finds elements', () => {
        const instance: InVp = new InVp('.js-reveal');
        expect(instance.get_elements('.js-reveal:not(.is-visible)')).not.toBeNull();
    });

    /**
     * Test if the observer call the register function well
     */
    test('observer', () => {
        const instance: InVp = new InVp('.js-reveal');
        const elements: NodeListOf<HTMLElement> = instance.get_elements('.js-reveal:not(.is-visible)');
        const spy = jest.spyOn(instance, 'register');
        instance.observe(elements);
        expect(spy).toBeCalled();
    });
});
