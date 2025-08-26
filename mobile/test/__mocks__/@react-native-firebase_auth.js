const auth = () => ({
  signInWithCredential: jest.fn(),
  currentUser: {
    getIdToken: jest.fn().mockResolvedValue('mock-firebase-token'),
  },
});

auth.GoogleAuthProvider = {
  credential: jest.fn().mockReturnValue('mock-credential'),
};

export default auth;
