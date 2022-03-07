import type { Config } from '@jest/types';

export default async (): Promise<Config.InitialOptions> => {
    return {
        roots: [
            '<rootDir>/tests'
        ],
        testEnvironment: 'jsdom',
        testEnvironmentOptions: {
            resources: 'usable'
        },
        moduleFileExtensions: [
            'ts',
            'js',
            'html'
        ],
        transform: {
            '^.+\\.ts?$': 'ts-jest',
            '^.+\\.html?$': 'html-loader-jest'
        }
    };
};
