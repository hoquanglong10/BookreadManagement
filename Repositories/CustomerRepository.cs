using CustomerManagement.API.Data;
using CustomerManagement.API.Models;
using Microsoft.EntityFrameworkCore;

namespace CustomerManagement.API.Repositories;

public class CustomerRepository(ApplicationDbContext context)
{
    public Task<List<Customer>> GetAllAsync() => context.Customers.AsNoTracking().ToListAsync();

    public Task<Customer?> GetByIdAsync(int id) => context.Customers.FindAsync(id).AsTask();

    public async Task AddAsync(Customer customer)
    {
        context.Customers.Add(customer);
        await context.SaveChangesAsync();
    }

    public Task SaveChangesAsync() => context.SaveChangesAsync();

    public async Task DeleteAsync(Customer customer)
    {
        context.Customers.Remove(customer);
        await context.SaveChangesAsync();
    }
}
