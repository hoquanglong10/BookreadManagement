using CustomerManagement.API.DTOs;
using CustomerManagement.API.Models;
using CustomerManagement.API.Repositories;

namespace CustomerManagement.API.Services;

public class CustomerService(CustomerRepository repository)
{
    public Task<List<Customer>> GetAllAsync() => repository.GetAllAsync();

    public Task<Customer?> GetByIdAsync(int id) => repository.GetByIdAsync(id);

    public async Task<Customer> CreateAsync(CreateCustomerDto request)
    {
        var customer = new Customer
        {
            FullName = request.FullName,
            Phone = request.Phone,
            Email = request.Email,
            Address = request.Address
        };
        await repository.AddAsync(customer);
        return customer;
    }

    public async Task<bool> UpdateAsync(int id, UpdateCustomerDto request)
    {
        var customer = await repository.GetByIdAsync(id);
        if (customer is null) return false;

        customer.FullName = request.FullName;
        customer.Phone = request.Phone;
        customer.Email = request.Email;
        customer.Address = request.Address;
        await repository.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var customer = await repository.GetByIdAsync(id);
        if (customer is null) return false;

        await repository.DeleteAsync(customer);
        return true;
    }
}
