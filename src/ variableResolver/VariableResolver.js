const variableResolver = require('@codefresh-io/cf-variable-resolver');
const SecretStoreResolver = require('@codefresh-io/cf-variable-resolver/lib/resolvers/secret-store');
const SecretStoreResolvers = require('@codefresh-io/cf-variable-resolver/lib/resolvers/secret-store/resolvers');
const getContextImpl = require('@codefresh-io/cf-variable-resolver/lib/impl/get-context');

class VariableResolver {
    constructor({ config }) {
        this.vr = variableResolver.build({
            'secrets': SecretStoreResolver.build({
                'kubernetes-secret': SecretStoreResolvers.kubernetesSecert,
                'kubernetes-configmap': SecretStoreResolvers.kubernetesConfigmap,
                'kubernetes-runtime-secret': SecretStoreResolvers.kubernetesRuntimeSecert,
                'kubernetes-runtime-configmap': SecretStoreResolvers.kubernetesRuntimeConfigmap,
                'hashicorp-vault': SecretStoreResolvers.hashicorpVault,
            }),
        }, {
            getContext: getContextImpl({ apiHost: config.apiHost, apiKey: config.env.apiKey }),
            log: console,
        });
    }

    async resolve(context) {
        return this.vr.resolveSecretReferences(context);
    }
}

module.exports = VariableResolver;
