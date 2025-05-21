# Tests

This directory contains tests for the application (specifically backend) .

## Test Structure

The tests are organized as follows:

- `unit/`: Unit tests for individual components
- `integration/`: Integration tests for API endpoints and service interactions
- `conftest.py`: Common fixtures and test setup

## Running Tests

You can run all tests using the provided script:

```bash
python run_tests.py
```

Or directly with pytest:

```bash
pytest -v tests/
```

### Running Specific Tests

To run unit tests only:

```bash
pytest -v tests/unit/
```

To run integration tests only:

```bash
pytest -v tests/integration/
```

To run a specific test file:

```bash
pytest -v tests/unit/test_text_analyzer.py
```

## Test Configuration

The tests will automatically:

1. Load environment variables from `backend/.env` if available
2. Set `TESTING=True` for the test environment
3. Configure proper import paths for the backend module

## Writing New Tests

When writing new tests:

1. Import directly from the `backend.app` module:

   ```python
   from backend.app.services.text_analysis import TextAnalyzer
   ```

2. Use the fixtures provided in `conftest.py` for common dependencies:

   ```python
   def test_my_function(db_session, mock_text_analyzer):
       # Test code using the fixtures
   ```

3. For mocking API dependencies, use `unittest.mock.patch` with the correct import path:

   ```python
   @patch('backend.app.api.some_module.SomeClass')
   def test_with_mock(mock_class):
       # Test with mock
   ``` 