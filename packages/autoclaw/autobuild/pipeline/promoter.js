/**
 * Promoter — promotes validated artifacts to production.
 */
class Promoter {
  constructor(opts = {}) {
    this.git = git;
    this.artifactStore = artifactStore;
  }

  async promote({ artifact, review, evalSummary }) {
    // 1. Create versioned artifact
    const version = await this.artifactStore.version(artifact);

    // 2. Commit to git
    const commit = await this.git.commit({
      message: `Promote artifact v${version}: ${artifact.name}`,
      files: [artifact.path],
    });

    // 3. Tag release
    await this.git.tag(`v${version}`, commit);

    return {
      status: 'promoted',
      version,
      commit,
      artifact,
    };
  }
}

export { Promoter };
